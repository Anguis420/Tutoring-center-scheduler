const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { 
  authenticateToken, 
  requireAdmin,
  requireOwnerOrAdmin 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students for the authenticated parent or admin
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let students;
    
    if (req.user.role === 'admin') {
      // Admin can see all students
      students = await Student.find({ isActive: true })
        .populate('parent', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'parent') {
      // Parent can only see their own children
      students = await Student.find({ 
        parent: req.user._id, 
        isActive: true 
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ students });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID (parent can only see their own children)
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('parent', 'firstName lastName email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user has access to this student
    if (req.user.role === 'parent' && student.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ student: student.getPublicProfile() });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error while fetching student' });
  }
});

// @route   POST /api/students
// @desc    Create new student (admin only)
// @access  Private (Admin)
router.post('/', [
  authenticateToken,
  requireAdmin,
  [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),
    body('age')
      .isInt({ min: 3, max: 18 })
      .withMessage('Age must be between 3 and 18'),
    body('grade')
      .trim()
      .notEmpty()
      .withMessage('Grade is required'),
    body('parent')
      .isMongoId()
      .withMessage('Valid parent ID is required'),
    body('subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array'),
    body('subjects.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Subject cannot be empty'),
    body('emergencyContact.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Emergency contact name must be between 2 and 50 characters'),
    body('emergencyContact.phone')
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('emergencyContact.relationship')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Relationship must be between 2 and 30 characters'),
    body('preferences.learningStyle')
      .optional()
      .isIn(['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'])
      .withMessage('Invalid learning style'),
    body('preferences.preferredTimes')
      .optional()
      .isArray()
      .withMessage('Preferred times must be an array'),
    body('preferences.preferredTimes.*.day')
      .optional()
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Invalid day of week'),
    body('preferences.preferredTimes.*.startTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time format (HH:MM)'),
    body('preferences.preferredTimes.*.endTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time format (HH:MM)')
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

    const {
      firstName,
      lastName,
      dateOfBirth,
      age,
      grade,
      parent,
      subjects,
      notes,
      emergencyContact,
      preferences
    } = req.body;

    // Create new student
    const student = new Student({
      firstName,
      lastName,
      dateOfBirth,
      age,
      grade,
      parent,
      subjects: subjects || [],
      notes,
      emergencyContact,
      preferences: preferences || { learningStyle: 'mixed', preferredTimes: [] }
    });

    await student.save();

    res.status(201).json({ 
      message: 'Student created successfully',
      student: student.getPublicProfile() 
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error while creating student' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student by ID (admin only)
// @access  Private (Admin)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),
    body('age')
      .optional()
      .isInt({ min: 3, max: 18 })
      .withMessage('Age must be between 3 and 18'),
    body('grade')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Grade cannot be empty'),
    body('subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array'),
    body('subjects.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Subject cannot be empty')
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

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Student updated successfully',
      student: updatedStudent.getPublicProfile() 
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error while updating student' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Deactivate student (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Soft delete - set isActive to false
    student.isActive = false;
    await student.save();

    res.json({ message: 'Student deactivated successfully' });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error while deactivating student' });
  }
});

// @route   GET /api/students/:id/appointments
// @desc    Get appointments for a specific student
// @access  Private
router.get('/:id/appointments', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user has access to this student
    if (req.user.role === 'parent' && student.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get appointments for this student
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ 
      student: req.params.id,
      status: { $ne: 'cancelled' }
    })
    .populate('teacher', 'firstName lastName')
    .populate('student', 'firstName lastName')
    .sort({ scheduledDate: 1, startTime: 1 });

    res.json({ appointments });

  } catch (error) {
    console.error('Get student appointments error:', error);
    res.status(500).json({ message: 'Server error while fetching student appointments' });
  }
});

module.exports = router; 