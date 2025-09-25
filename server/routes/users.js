const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireAdmin, 
  requireOwnerOrAdmin,
  requireAdminOrTeacher 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/teachers
// @desc    Get all teachers (public for booking)
// @access  Public
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: 'teacher', 
      isActive: true 
    })
    .select('firstName lastName subjects')
    .sort({ firstName: 1 });

    // Return empty array if no teachers found
    res.json(teachers.length === 0 ? [] : teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Return empty response if no users found
    if (users.length === 0) {
      return res.json({
        users: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalUsers: 0,
          usersPerPage: parseInt(limit)
        }
      });
    }

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        usersPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin or owner)
// @access  Private
router.get('/:id', authenticateToken, requireOwnerOrAdmin('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.getPublicProfile() });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   POST /api/users
// @desc    Create new user (admin only)
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
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .isIn(['admin', 'teacher', 'parent'])
      .withMessage('Role must be admin, teacher, or parent'),
    body('phone')
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number')
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

    const { firstName, lastName, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      isActive: true
    });

    await user.save();

    // Return user without password
    const userResponse = user.getPublicProfile();
    res.status(201).json({ 
      message: 'User created successfully',
      user: userResponse 
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID (admin or owner)
// @access  Private
router.put('/:id', [
  authenticateToken,
  requireOwnerOrAdmin('id'),
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
    body('phone')
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
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

    const { firstName, lastName, phone, isActive, children, subjects, qualifications, experience, hourlyRate, availability } = req.body;
    const updateFields = {};

    // Basic fields
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone) updateFields.phone = phone;
    
    // Only admin can update isActive
    if (req.user.role === 'admin' && isActive !== undefined) {
      updateFields.isActive = isActive;
    }

    // Role-specific updates
    if (req.user.role === 'admin' || req.user.role === 'parent') {
      if (children) updateFields.children = children;
    }

    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      if (subjects) updateFields.subjects = subjects;
      if (qualifications) updateFields.qualifications = qualifications;
      if (experience) updateFields.experience = experience;
      if (hourlyRate) updateFields.hourlyRate = hourlyRate;
      if (availability) updateFields.availability = availability;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if trying to delete the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    // Soft delete - set isActive to false instead of removing
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   GET /api/users/role/:role
// @desc    Get users by role (admin only)
// @access  Private (Admin)
router.get('/role/:role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!['admin', 'parent', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find({ role, isActive: true })
      .select('-password')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ role, isActive: true });

    // Return empty response if no users found
    if (users.length === 0) {
      return res.json({
        users: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalUsers: 0,
          usersPerPage: parseInt(limit)
        }
      });
    }

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        usersPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error while fetching users by role' });
  }
});

// @route   GET /api/users/teachers/available
// @desc    Get available teachers for a specific subject and time
// @access  Private (Admin, Teacher, Parent)
router.get('/teachers/available', authenticateToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { subject, dayOfWeek, startTime, endTime } = req.query;
    
    if (!subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Subject, dayOfWeek, startTime, and endTime are required' 
      });
    }

    // Find teachers who teach the subject and are available at the specified time
    const teachers = await User.find({
      role: 'teacher',
      isActive: true,
      subjects: { $in: [subject] }
    }).select('-password');

    // Filter teachers based on availability
    const availableTeachers = teachers.filter(teacher => {
      if (!teacher.availability || teacher.availability.length === 0) {
        return false;
      }

      return teacher.availability.some(slot => 
        slot.day === dayOfWeek &&
        slot.startTime <= startTime &&
        slot.endTime >= endTime
      );
    });

    // Return empty response if no available teachers found
    if (availableTeachers.length === 0) {
      return res.json({ 
        teachers: [],
        total: 0
      });
    }

    res.json({ 
      teachers: availableTeachers.map(teacher => teacher.getPublicProfile()),
      total: availableTeachers.length
    });

  } catch (error) {
    console.error('Get available teachers error:', error);
    res.status(500).json({ message: 'Server error while fetching available teachers' });
  }
});

// @route   GET /api/users/parents/children/:parentId
// @desc    Get children of a specific parent (admin or parent owner)
// @access  Private
router.get('/parents/children/:parentId', authenticateToken, requireOwnerOrAdmin('parentId'), async (req, res) => {
  try {
    const parent = await User.findById(req.params.parentId).select('children');
    
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json({ children: parent.children || [] });

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ message: 'Server error while fetching children' });
  }
});

// @route   PUT /api/users/parents/children/:parentId
// @desc    Update children of a specific parent (admin or parent owner)
// @access  Private
router.put('/parents/children/:parentId', [
  authenticateToken,
  requireOwnerOrAdmin('parentId'),
  [
    body('children')
      .isArray()
      .withMessage('Children must be an array'),
    body('children.*.name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Child name must be between 2 and 50 characters'),
    body('children.*.grade')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Grade cannot exceed 20 characters'),
    body('children.*.subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array')
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

    const { children } = req.body;

    const updatedParent = await User.findByIdAndUpdate(
      req.params.parentId,
      { $set: { children } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedParent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json({
      message: 'Children updated successfully',
      children: updatedParent.children
    });

  } catch (error) {
    console.error('Update children error:', error);
    res.status(500).json({ message: 'Server error while updating children' });
  }
});

module.exports = router; 