const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (Array.isArray(roles)) {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions. Required roles: ' + roles.join(', ') 
        });
      }
    } else {
      if (req.user.role !== roles) {
        return res.status(403).json({ 
          message: `Insufficient permissions. Required role: ${roles}` 
        });
      }
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user is teacher
const requireTeacher = requireRole('teacher');

// Middleware to check if user is parent
const requireParent = requireRole('parent');

// Middleware to check if user is admin or teacher
const requireAdminOrTeacher = requireRole(['admin', 'teacher']);

// Middleware to check if user is admin or parent
const requireAdminOrParent = requireRole(['admin', 'parent']);

// Middleware to check if user can access resource (owner or admin)
const requireOwnerOrAdmin = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceId = req.params[resourceField] || req.body[resourceField];
    if (req.user._id.toString() === resourceId) {
      return next();
    }

    res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
  };
};

// Middleware to check if user can access schedule (teacher owner or admin)
const requireScheduleAccess = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const scheduleId = req.params.id || req.params.scheduleId || req.body.scheduleId;
      if (!scheduleId) {
        return res.status(400).json({ message: 'Schedule ID required' });
      }
      // Validate ObjectId format (prevents CastError -> 500)
      if (!/^[0-9a-fA-F]{24}$/.test(String(scheduleId))) {
        return res.status(400).json({ message: 'Invalid schedule ID' });
      }

      // Import here to avoid circular dependency
      const Schedule = require('../models/Schedule');
      const schedule = await Schedule.findById(scheduleId);

      // Check if user is the teacher who owns this schedule
      if (req.user.role === 'teacher') {
        if (!schedule.teacher) {
          return res.status(400).json({ message: 'Schedule has no assigned teacher' });
        }
        const teacherId = String(schedule.teacher._id || schedule.teacher);
        if (String(req.user._id) !== teacherId) {
          return res.status(403).json({ message: 'Access denied. You can only manage your own schedules.' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied. Only teachers and admins can manage schedules.' });
      }      } else {
        return res.status(403).json({ message: 'Access denied. Only teachers and admins can manage schedules.' });
      }

      req.schedule = schedule;
      next();
    } catch (error) {
      console.error('Schedule access middleware error:', error);
      res.status(500).json({ message: 'Error checking schedule access' });
    }
  };
};

// Middleware to check if user can access appointment (student, teacher, or admin)
const requireAppointmentAccess = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const appointmentId = req.params.id || req.params.appointmentId;
      if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID required' });
      }

      // Import here to avoid circular dependency
      const Appointment = require('../models/Appointment');
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if user is the student, teacher, or admin
      if (req.user.role === 'parent') {
        // Parent can access if they have a child who is the student
        const hasAccess = req.user.children.some(child => 
          child._id && child._id.toString() === appointment.student.toString()
        );
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied to this appointment' });
        }
      } else if (req.user.role === 'teacher') {
        // Teacher can access if they are the teacher for this appointment
        if (req.user._id.toString() !== appointment.teacher.toString()) {
          return res.status(403).json({ message: 'Access denied to this appointment' });
        }
      }

      req.appointment = appointment;
      next();
    } catch (error) {
      console.error('Appointment access middleware error:', error);
      res.status(500).json({ message: 'Error checking appointment access' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireParent,
  requireAdminOrTeacher,
  requireAdminOrParent,
  requireOwnerOrAdmin,
  requireScheduleAccess,
  requireAppointmentAccess
}; 