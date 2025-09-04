const express = require('express');
const { body, validationResult } = require('express-validator');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireAdmin, 
  requireTeacher,
  requireOwnerOrAdmin,
  requireAdminOrTeacher,
  requireScheduleAccess
} = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/schedules
// @desc    Create a new schedule (admin or teacher)
// @access  Private
router.post('/', [
  authenticateToken,
  requireAdminOrTeacher,
  [
    body('teacher')
      .isMongoId()
      .withMessage('Valid teacher ID is required'),
    body('dayOfWeek')
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Valid day of week is required'),
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time is required (HH:MM)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time is required (HH:MM)'),
    body('subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array'),
    body('maxStudents')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Max students must be between 1 and 10'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Notes cannot exceed 200 characters')
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
      teacher, 
      dayOfWeek, 
      startTime, 
      endTime, 
      subjects, 
      maxStudents, 
      notes,
      breaks 
    } = req.body;

    // Check if teacher exists and is a teacher
    const teacherUser = await User.findById(teacher);
    if (!teacherUser) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacherUser.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    // Check if user can create schedule for this teacher
    if (req.user.role !== 'admin' && req.user._id.toString() !== teacher) {
      return res.status(403).json({ message: 'You can only create schedules for yourself' });
    }

    // Check for time conflicts
    const conflicts = await Schedule.findConflicts(teacher, dayOfWeek, startTime, endTime);
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Schedule conflict detected',
        conflicts: conflicts.map(c => ({
          id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          dayOfWeek: c.dayOfWeek
        }))
      });
    }

    // Create schedule
    const schedule = new Schedule({
      teacher,
      dayOfWeek,
      startTime,
      endTime,
      subjects: subjects || [],
      maxStudents: maxStudents || 1,
      notes,
      breaks: breaks || []
    });

    await schedule.save();

    // Populate teacher details
    await schedule.populate('teacher');

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error while creating schedule' });
  }
});

// @route   GET /api/schedules/daily/:date
// @desc    Get teacher's daily schedule with student appointments
// @access  Private (teacher only)
router.get('/daily/:date', [
  authenticateToken,
  requireTeacher
], async (req, res) => {
  try {
    const { date } = req.params;
    const scheduleDate = new Date(date);
    const dayOfWeek = scheduleDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get teacher's schedules for this day
    const schedules = await Schedule.find({
      teacher: req.user._id,
      dayOfWeek: dayOfWeek,
      isAvailable: true
    }).populate('teacher');

    // Get appointments for this date
    const startOfDay = new Date(scheduleDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduleDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      teacher: req.user._id,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled'] }
    })
    .populate('student')
    .sort({ startTime: 1 });

    // Group appointments by schedule time slots
    const scheduleWithStudents = schedules.map(schedule => {
      const scheduleAppointments = appointments.filter(apt => 
        apt.startTime === schedule.startTime && 
        apt.endTime === schedule.endTime
      );

      return {
        ...schedule.toObject(),
        students: scheduleAppointments.map(apt => ({
          _id: apt.student._id,
          firstName: apt.student.firstName,
          lastName: apt.student.lastName,
          fullName: apt.student.fullName,
          grade: apt.student.grade,
          subject: apt.subject,
          appointmentId: apt._id,
          status: apt.status,
          notes: apt.notes
        })),
        totalBooked: scheduleAppointments.length,
        availableSlots: schedule.maxStudents - scheduleAppointments.length
      };
    });

    res.json({
      date: scheduleDate,
      dayOfWeek,
      schedules: scheduleWithStudents,
      totalAppointments: appointments.length
    });

  } catch (error) {
    console.error('Get daily schedule error:', error);
    res.status(500).json({ message: 'Server error while fetching daily schedule' });
  }
});

// @route   GET /api/schedules
// @desc    Get schedules with filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      teacher, 
      dayOfWeek, 
      isAvailable, 
      subject,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    let query = {};

    // Apply filters
    if (teacher) query.teacher = teacher;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
    if (subject) query.subjects = { $in: [subject] };

    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'parent') {
      // Parents can see all available schedules
      query.isAvailable = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const schedules = await Schedule.find(query)
      .populate('teacher')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Schedule.countDocuments(query);

    res.json({
      schedules,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSchedules: total,
        schedulesPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
});

// @route   GET /api/schedules/:id
// @desc    Get schedule by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('teacher');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && 
        req.user.role !== 'teacher' && 
        req.user._id.toString() !== schedule.teacher._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this schedule' });
    }

    res.json({ schedule });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error while fetching schedule' });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule
// @access  Private (admin or teacher owner)
router.put('/:id', [
  authenticateToken,
  requireScheduleAccess(),
  [
    body('dayOfWeek')
      .optional()
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Valid day of week is required'),
    body('startTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time is required (HH:MM)'),
    body('endTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time is required (HH:MM)'),
    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('isAvailable must be a boolean'),
    body('subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array'),
    body('maxStudents')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Max students must be between 1 and 10'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Notes cannot exceed 200 characters')
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

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const { 
      dayOfWeek, 
      startTime, 
      endTime, 
      isAvailable, 
      subjects, 
      maxStudents, 
      notes,
      breaks 
    } = req.body;

    const updateFields = {};

    // Check for conflicts if time is being changed
    if ((dayOfWeek && dayOfWeek !== schedule.dayOfWeek) || 
        (startTime && startTime !== schedule.startTime) || 
        (endTime && endTime !== schedule.endTime)) {
      
      const newDay = dayOfWeek || schedule.dayOfWeek;
      const newStart = startTime || schedule.startTime;
      const newEnd = endTime || schedule.endTime;

      const conflicts = await Schedule.findConflicts(
        schedule.teacher, 
        newDay, 
        newStart, 
        newEnd, 
        schedule._id
      );

      if (conflicts.length > 0) {
        return res.status(400).json({ 
          message: 'Schedule conflict detected',
          conflicts: conflicts.map(c => ({
            id: c._id,
            startTime: c.startTime,
            endTime: c.endTime,
            dayOfWeek: c.dayOfWeek
          }))
        });
      }
    }

    // Update fields
    if (dayOfWeek) updateFields.dayOfWeek = dayOfWeek;
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable;
    if (subjects) updateFields.subjects = subjects;
    if (maxStudents) updateFields.maxStudents = maxStudents;
    if (notes !== undefined) updateFields.notes = notes;
    if (breaks) updateFields.breaks = breaks;

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('teacher');

    res.json({
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error while updating schedule' });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule
// @access  Private (admin or teacher owner)
router.delete('/:id', [
  authenticateToken,
  requireScheduleAccess()
], async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if schedule has current bookings
    if (schedule.currentBookings > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete schedule with current bookings' 
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error while deleting schedule' });
  }
});

// @route   GET /api/schedules/teacher/:teacherId
// @desc    Get all schedules for a specific teacher
// @access  Private
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { dayOfWeek, isAvailable } = req.query;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { teacher: teacherId };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const schedules = await Schedule.find(query)
      .populate('teacher')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ schedules });

  } catch (error) {
    console.error('Get teacher schedules error:', error);
    res.status(500).json({ message: 'Server error while fetching teacher schedules' });
  }
});

// @route   GET /api/schedules/available
// @desc    Get available schedules for a specific subject and time
// @access  Private
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { subject, dayOfWeek, startTime, endTime } = req.query;
    
    if (!subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Subject, dayOfWeek, startTime, and endTime are required' 
      });
    }

    const availableSchedules = await Schedule.findAvailable(dayOfWeek, startTime, endTime, subject);

    res.json({ 
      schedules: availableSchedules,
      total: availableSchedules.length
    });

  } catch (error) {
    console.error('Get available schedules error:', error);
    res.status(500).json({ message: 'Server error while fetching available schedules' });
  }
});

// @route   POST /api/schedules/:id/breaks
// @desc    Add break time to schedule
// @access  Private (admin or teacher owner)
router.post('/:id/breaks', [
  authenticateToken,
  requireScheduleAccess(),
  [
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time is required (HH:MM)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time is required (HH:MM)')
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

    const { startTime, endTime } = req.body;
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Validate break time is within schedule time
    if (!schedule.isTimeSlotAvailable(startTime, endTime)) {
      return res.status(400).json({ message: 'Break time must be within schedule time' });
    }

    // Add break
    schedule.breaks.push({ startTime, endTime });
    await schedule.save();

    res.json({
      message: 'Break added successfully',
      schedule
    });

  } catch (error) {
    console.error('Add break error:', error);
    res.status(500).json({ message: 'Server error while adding break' });
  }
});

// @route   DELETE /api/schedules/:id/breaks/:breakId
// @desc    Remove break time from schedule
// @access  Private (admin or teacher owner)
router.delete('/:id/breaks/:breakId', [
  authenticateToken,
  requireScheduleAccess()
], async (req, res) => {
  try {
    const { id, breakId } = req.params;
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const breakIndex = schedule.breaks.findIndex(b => b._id.toString() === breakId);
    if (breakIndex === -1) {
      return res.status(404).json({ message: 'Break not found' });
    }

    schedule.breaks.splice(breakIndex, 1);
    await schedule.save();

    res.json({
      message: 'Break removed successfully',
      schedule
    });

  } catch (error) {
    console.error('Remove break error:', error);
    res.status(500).json({ message: 'Server error while removing break' });
  }
});

module.exports = router; 