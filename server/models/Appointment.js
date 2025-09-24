const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    required: false, // Will be calculated in pre-save hook
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'available'
  },
  // Who booked this appointment (for parent bookings)
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // When it was booked
  bookedAt: {
    type: Date,
    required: false
  },
  location: {
    type: String,
    enum: ['in-person', 'online', 'hybrid'],
    default: 'in-person'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  teacherNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Teacher notes cannot exceed 500 characters']
  },
  parentNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Parent notes cannot exceed 500 characters']
  },
  // Rescheduling fields
  originalAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduleReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reschedule reason cannot exceed 200 characters']
  },
  rescheduleRequestedBy: {
    type: String,
    enum: ['parent', 'teacher', 'admin'],
    required: false
  },
  rescheduleRequestedAt: {
    type: Date
  },
  // Progress tracking
  attendance: {
    type: String,
    enum: ['present', 'absent', 'late', 'cancelled'],
    default: 'present'
  },
  completionStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'cancelled'],
    default: 'not-started'
  },
  // Payment tracking (for future enhancement)
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentAmount: {
    type: Number,
    min: 0
  },
  // Recurring appointment support
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly']
    },
    endDate: Date,
    nextAppointment: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ student: 1, scheduledDate: 1 });
appointmentSchema.index({ teacher: 1, scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledDate: 1, startTime: 1 });

// Virtual for appointment date and time
appointmentSchema.virtual('appointmentDateTime').get(function() {
  return {
    date: this.scheduledDate,
    startTime: this.startTime,
    endTime: this.endTime
  };
});

// Virtual for checking if appointment is in the past
appointmentSchema.virtual('isPast').get(function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return appointmentDateTime < now;
});

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.scheduledDate);
  return today.toDateString() === appointmentDate.toDateString();
});

// Pre-save middleware to calculate duration and validate required fields
appointmentSchema.pre('save', function(next) {
  // Always calculate duration from startTime and endTime if both are present
  if (this.startTime && this.endTime) {
    
    // Validate time format before calculation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.startTime) || !timeRegex.test(this.endTime)) {
      const error = new mongoose.Error.ValidationError();
      error.addError('duration', new mongoose.Error.ValidatorError({
        message: 'Duration cannot be calculated with invalid time format',
        type: 'required',
        path: 'duration',
        value: this.duration
      }));
      return next(error);
    }
    
    try {
      const start = this.startTime.split(':').map(Number);
      const end = this.endTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      
      // Validate that end time is after start time
      if (endMinutes <= startMinutes) {
        const error = new mongoose.Error.ValidationError();
        error.addError('duration', new mongoose.Error.ValidatorError({
          message: 'End time must be after start time to calculate duration',
          type: 'required',
          path: 'duration',
          value: this.duration
        }));
        return next(error);
      }
      
      this.duration = endMinutes - startMinutes;
    } catch (err) {
      const error = new mongoose.Error.ValidationError();
      error.addError('duration', new mongoose.Error.ValidatorError({
        message: 'Duration cannot be calculated due to invalid time values',
        type: 'required',
        path: 'duration',
        value: this.duration
      }));
      return next(error);
    }
  } else {
    // If startTime or endTime is missing, duration cannot be calculated
    const error = new mongoose.Error.ValidationError();
    error.addError('duration', new mongoose.Error.ValidatorError({
      message: 'Duration cannot be calculated without both startTime and endTime',
      type: 'required',
      path: 'duration',
      value: this.duration
    }));
    return next(error);
  }
  next();
});

// Pre-init hook to stash the original document for comparison
appointmentSchema.pre('init', function() {
  this._original = this.toObject();
});

// Pre-save hook to enforce booking-field consistency
appointmentSchema.pre('save', function(next) {
  // Check if status is being modified or if it's already 'booked'
  const isStatusModified = this.isModified('status');
  const isCurrentlyBooked = this.status === 'booked';
  const wasBooked = this.isModified('status') ? (this._original && this._original.status === 'booked') : false;
  
  // If status is 'booked' (either newly set or already set)
  if (isCurrentlyBooked) {
    // Require bookedBy when status is 'booked'
    if (!this.bookedBy) {
      return next(new Error('bookedBy is required when status is "booked"'));
    }
    
    // Set bookedAt to current date if not present
    if (!this.bookedAt) {
      this.bookedAt = new Date();
    }
  }
  // If status is not 'booked' (either changed away from 'booked' or was never 'booked')
  else if (isStatusModified || wasBooked) {
    // Clear booking fields when status is not 'booked'
    this.bookedBy = undefined;
    this.bookedAt = undefined;
  }
  
  next();
});

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, teacherId = null) {
  const query = {
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (teacherId) {
    query.teacher = teacherId;
  }
  
  return this.find(query).populate('student teacher');
};

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(userId, role, limit = 10) {
  const now = new Date();
  const query = {
    scheduledDate: { $gte: now }
  };
  
  if (role === 'teacher') {
    query.teacher = userId;
  } else if (role === 'parent') {
    query.student = userId;
  }
  
  return this.find(query)
    .populate('student teacher')
    .sort({ scheduledDate: 1, startTime: 1 })
    .limit(limit);
};

// Static method to find conflicting appointments
appointmentSchema.statics.findConflicts = function(teacherId, date, startTime, endTime, excludeId = null) {
  const query = {
    teacher: teacherId,
    scheduledDate: date,
    status: { $nin: ['cancelled', 'rescheduled'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};


module.exports = mongoose.model('Appointment', appointmentSchema); 