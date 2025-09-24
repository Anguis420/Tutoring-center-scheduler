const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Student = require('../models/Student');
const { logError, createSafeErrorResponse } = require('../utils/errorLogger');
const { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrTeacher,
  requireAppointmentAccess,
  requireTeacher,
  requireParent
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
    const [studentDoc, teacherUser] = await Promise.all([
      Student.findById(student).populate('parent'),
      User.findById(teacher)
    ]);

    if (!studentDoc || !teacherUser) {
      return res.status(404).json({ message: 'Student or teacher not found' });
    }

    if (teacherUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher role' });
    }

    // Validate that the student's parent has the correct role
    if (!studentDoc.parent || studentDoc.parent.role !== 'parent') {
      return res.status(400).json({ message: 'Invalid student relationship - student must be associated with a parent user' });
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

    // Use a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Only save the appointment within the transaction
      // Remove the schedule update as there's no schedule in this context
      await appointment.save({ session });

      // Commit only if both operations succeed
      await session.commitTransaction();
    } catch (error) {
      // Roll back on any failure
      await session.abortTransaction();
      throw error;
    } finally {
      // Clean up the session
      session.endSession();
    }
    // Populate student and teacher details
    await appointment.populate('student teacher');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });

  } catch (error) {
    logError('Create appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while creating appointment'));
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
    logError('Get appointments error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while fetching appointments'));
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private (with access control)
router.get('/:id', authenticateToken, requireAppointmentAccess(), async (req, res) => {
  try {
    res.json({ appointment: req.appointment });
  } catch (error) {
    logError('Get appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while fetching appointment'));
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
      .isIn(['available', 'booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'])
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
    logError('Update appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while updating appointment'));
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
      status: 'booked'
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
    logError('Reschedule appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while rescheduling appointment'));
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
    logError('Cancel appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while cancelling appointment'));
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
    logError('Get upcoming appointments error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while fetching upcoming appointments'));
  }
});

// @route   POST /api/appointments/book-from-schedule
// @desc    Book appointment from available schedule (parent only)
// @access  Private (Parent)
router.post('/book-from-schedule', [
  authenticateToken,
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

    // Only parents can book from schedules
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can book appointments from schedules' });
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
    const [studentDoc, teacherUser] = await Promise.all([
      Student.findById(student).populate('parent'),
      User.findById(teacher)
    ]);

    if (!studentDoc || !teacherUser) {
      return res.status(404).json({ message: 'Student or teacher not found' });
    }

    if (teacherUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher role' });
    }

    // Validate that the student's parent has the correct role
    if (!studentDoc.parent || studentDoc.parent.role !== 'parent') {
      return res.status(400).json({ message: 'Invalid student relationship - student must be associated with a parent user' });
    }

    // Check if the student belongs to the parent
    // Check if the student belongs to the parent
    if (studentDoc.parent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only book appointments for your own children' });
    }

    // Check if there's an available schedule for this teacher, day, and time
    const scheduleDate = new Date(scheduledDate);
    
    // Validate date
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduled date format' });
    }
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[scheduleDate.getDay()];
    
    const availableSchedule = await Schedule.findOne({
      teacher: teacher,
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      isAvailable: true,
      subjects: { $in: [subject] },
      $expr: { $lt: ['$currentBookings', '$maxStudents'] }
    });

    if (!availableSchedule) {
      return res.status(400).json({ 
        message: 'No available schedule found for this teacher, day, time, and subject' 
      });
    }

    // Check if the schedule has capacity
    if (availableSchedule.currentBookings >= availableSchedule.maxStudents) {
      return res.status(400).json({ message: 'This schedule is fully booked' });
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

    // Calculate duration in minutes
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    // Create appointment
    const appointment = new Appointment({
      student,
      teacher,
      subject,
      scheduledDate,
      startTime,
      endTime,
      duration,
      location: location || 'in-person',
      notes,
      status: 'available'
    });

    // Use a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await appointment.save({ session });
      
      // Update schedule booking count
      availableSchedule.currentBookings += 1;
      await availableSchedule.save({ session });
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    await appointment.populate('student teacher');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    logError('Book appointment from schedule error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while booking appointment'));
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
    logError('Check conflicts error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while checking conflicts'));
  }
});

// @route   GET /api/appointments/teacher
// @desc    Get teacher's assigned appointments (read-only)
// @access  Private (Teacher only)
router.get('/teacher', [
  authenticateToken,
  requireTeacher
], async (req, res) => {
  try {
    const appointments = await Appointment.find({
      teacher: req.user._id
    })
    .populate('student', 'firstName lastName')
    .populate('bookedBy', 'firstName lastName email')
    .sort({ scheduledDate: 1, startTime: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    logError('Get teacher appointments error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while fetching appointments'));
  }
});

// @route   GET /api/appointments/available
// @desc    Get available appointments for booking (parents only)
// @access  Private (Parent only)
router.get('/available', [
  authenticateToken,
  requireParent
], async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: 'available'
    })
    .populate('teacher', 'firstName lastName subjects')
    .sort({ scheduledDate: 1, startTime: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    logError('Get available appointments error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while fetching available appointments'));
  }
});

// @route   POST /api/appointments/book
// @desc    Book an available appointment (parents only)
// @access  Private (Parent only)
router.post('/book', [
  authenticateToken,
  requireParent,
  [
    body('appointmentId')
      .isMongoId()
      .withMessage('Valid appointment ID is required'),
    body('student')
      .isMongoId()
      .withMessage('Valid student ID is required'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { appointmentId, student, notes } = req.body;

    // Check if appointment exists and is available
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status !== 'available') {
      return res.status(400).json({ message: 'Appointment is not available for booking' });
    }

    // Check if student belongs to parent
    const studentDoc = await Student.findById(student).populate('parent');
    if (!studentDoc || !studentDoc.parent || studentDoc.parent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only book appointments for your own children' });
    }
    appointment.status = 'booked';
    appointment.bookedBy = req.user._id;
    appointment.bookedAt = new Date();
    appointment.student = student;
    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment successfully booked',
      appointment
    });
  } catch (error) {
    logError('Book appointment error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while booking appointment'));
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status (admin only)
// @access  Private (Admin only)
router.put('/:id/status', [
  authenticateToken,
  requireAdmin,
  [
    body('status')
      .isIn(['available', 'booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'])
      .withMessage('Valid status is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    logError('Update appointment status error', error, req);
    res.status(500).json(createSafeErrorResponse(error, 'Server error while updating appointment status'));
  }
});

module.exports = router; 