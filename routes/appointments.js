const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrTeacher,
  requireAppointmentAccess 
} = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/appointments
// @desc    Create a new appointment (admin only)
// @access  Private (Admin)
router.post('/', [
  authenticateToken,
  requireAdmin,
  [
    body('student')
      .isMongoId()
      .withMessage('Valid student ID is required'),
    body('teacher')
      .isMongoId()
      .withMessage('Valid teacher ID is required'),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required'),
    body('scheduledDate')
      .isISO8601()
      .withMessage('Valid scheduled date is required'),
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time is required (HH:MM)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time is required (HH:MM)'),
    body('location')
      .optional()
      .isIn(['in-person', 'online', 'hybrid'])
      .withMessage('Location must be in-person, online, or hybrid'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { 
      student, 
      teacher, 
      subject, 
      scheduledDate, 
      startTime, 
      endTime, 
      location, 
      notes 
    } = req.body;

    // Check if student and teacher exist
    const [studentUser, teacherUser] = await Promise.all([
      User.findById(student),
      User.findById(teacher)
    ]);

    if (!studentUser || !teacherUser) {
      return res.status(404).json({ message: 'Student or teacher not found' });
    }

    if (studentUser.role !== 'parent' || teacherUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid student or teacher role' });
    }

    // Check for scheduling conflicts
    const conflicts = await Appointment.findConflicts(teacher, scheduledDate, startTime, endTime);
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Scheduling conflict detected',
        conflicts: conflicts.map(c => ({
          id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          student: c.student
        }))
      });
    }

    // Create appointment
    const appointment = new Appointment({
      student,
      teacher,
      subject,
      scheduledDate,
      startTime,
      endTime,
      location: location || 'in-person',
      notes
    });

    await appointment.save();

    // Populate student and teacher details
    await appointment.populate('student teacher');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error while creating appointment' });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments with filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      teacher, 
      student, 
      subject,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query based on user role
    let query = {};

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'parent') {
      // Parents can see appointments for their children
      const parentUser = await User.findById(req.user._id);
      const childIds = parentUser.children.map(child => child._id);
      query.student = { $in: childIds };
    }

    // Apply filters
    if (status) query.status = status;
    if (teacher) query.teacher = teacher;
    if (student) query.student = student;
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate('student teacher')
      .sort({ scheduledDate: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAppointments: total,
        appointmentsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error while fetching appointments' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private (with access control)
router.get('/:id', authenticateToken, requireAppointmentAccess(), async (req, res) => {
  try {
    res.json({ appointment: req.appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error while fetching appointment' });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (admin, teacher, or parent with access)
router.put('/:id', [
  authenticateToken,
  requireAppointmentAccess(),
  [
    body('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('teacherNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Teacher notes cannot exceed 500 characters'),
    body('parentNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Parent notes cannot exceed 500 characters'),
    body('attendance')
      .optional()
      .isIn(['present', 'absent', 'late', 'cancelled'])
      .withMessage('Invalid attendance status'),
    body('completionStatus')
      .optional()
      .isIn(['not-started', 'in-progress', 'completed', 'cancelled'])
      .withMessage('Invalid completion status')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const appointment = req.appointment;
    const updateFields = {};

    // Determine what fields can be updated based on user role
    if (req.user.role === 'admin') {
      // Admin can update everything
      Object.assign(updateFields, req.body);
    } else if (req.user.role === 'teacher') {
      // Teachers can update status, notes, attendance, and completion status
      if (req.body.status) updateFields.status = req.body.status;
      if (req.body.teacherNotes) updateFields.teacherNotes = req.body.teacherNotes;
      if (req.body.attendance) updateFields.attendance = req.body.attendance;
      if (req.body.completionStatus) updateFields.completionStatus = req.body.completionStatus;
    } else if (req.user.role === 'parent') {
      // Parents can only update parent notes
      if (req.body.parentNotes) updateFields.parentNotes = req.body.parentNotes;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointment._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('student teacher');

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error while updating appointment' });
  }
});

// @route   POST /api/appointments/:id/reschedule
// @desc    Request appointment rescheduling
// @access  Private (parent or teacher with access)
router.post('/:id/reschedule', [
  authenticateToken,
  requireAppointmentAccess(),
  [
    body('newDate')
      .isISO8601()
      .withMessage('Valid new date is required'),
    body('newStartTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid new start time is required (HH:MM)'),
    body('newEndTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid new end time is required (HH:MM)'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const appointment = req.appointment;
    const { newDate, newStartTime, newEndTime, reason } = req.body;

    // Check if appointment can be rescheduled
    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Cannot reschedule cancelled or completed appointments' });
    }

    // Check for conflicts with new time
    const conflicts = await Appointment.findConflicts(
      appointment.teacher, 
      newDate, 
      newStartTime, 
      newEndTime, 
      appointment._id
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'New time conflicts with existing appointments',
        conflicts: conflicts.map(c => ({
          id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          student: c.student
        }))
      });
    }

    // Create new appointment with rescheduled time
    const newAppointment = new Appointment({
      student: appointment.student,
      teacher: appointment.teacher,
      subject: appointment.subject,
      scheduledDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: appointment.location,
      notes: appointment.notes,
      originalAppointment: appointment._id,
      rescheduleReason: reason,
      rescheduleRequestedBy: req.user.role,
      rescheduleRequestedAt: new Date(),
      status: 'scheduled'
    });

    await newAppointment.save();

    // Update original appointment status
    appointment.status = 'rescheduled';
    await appointment.save();

    // Populate details
    await newAppointment.populate('student teacher');

    res.status(201).json({
      message: 'Appointment rescheduled successfully',
      newAppointment,
      originalAppointment: appointment
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error while rescheduling appointment' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private (admin or teacher with access)
router.delete('/:id', [
  authenticateToken,
  requireAppointmentAccess()
], async (req, res) => {
  try {
    const appointment = req.appointment;

    // Check if appointment can be cancelled
    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment is already cancelled or completed' });
    }

    // Only admin or the assigned teacher can cancel
    if (req.user.role !== 'admin' && req.user._id.toString() !== appointment.teacher.toString()) {
      return res.status(403).json({ message: 'Only admin or assigned teacher can cancel appointments' });
    }

    appointment.status = 'cancelled';
    appointment.attendance = 'cancelled';
    appointment.completionStatus = 'cancelled';
    await appointment.save();

    res.json({ 
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error while cancelling appointment' });
  }
});

// @route   GET /api/appointments/upcoming/:userId
// @desc    Get upcoming appointments for a user
// @access  Private
router.get('/upcoming/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const appointments = await Appointment.findUpcoming(userId, req.user.role, parseInt(limit));

    res.json({ appointments });

  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Server error while fetching upcoming appointments' });
  }
});

// @route   GET /api/appointments/conflicts
// @desc    Check for scheduling conflicts
// @access  Private (Admin, Teacher)
router.get('/conflicts', [
  authenticateToken,
  requireAdminOrTeacher
], async (req, res) => {
  try {
    const { teacherId, date, startTime, endTime, excludeId } = req.query;

    if (!teacherId || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Teacher ID, date, start time, and end time are required' 
      });
    }

    const conflicts = await Appointment.findConflicts(teacherId, date, startTime, endTime, excludeId);

    res.json({ 
      conflicts: conflicts.map(c => ({
        id: c._id,
        startTime: c.startTime,
        endTime: c.endTime,
        student: c.student,
        subject: c.subject,
        status: c.status
      })),
      hasConflicts: conflicts.length > 0
    });

  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({ message: 'Server error while checking conflicts' });
  }
});

module.exports = router; 