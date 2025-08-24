const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: [true, 'Day of week is required']
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
  isAvailable: {
    type: Boolean,
    default: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  maxStudents: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  currentBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  // Break time within the schedule
  breaks: [{
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    duration: {
      type: Number,
      min: 5,
      max: 60
    }
  }],
  // Special dates (holidays, personal days)
  specialDates: [{
    date: {
      type: Date,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [100, 'Reason cannot exceed 100 characters']
    }
  }],
  // Recurring schedule settings
  isRecurring: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date
  },
  // Notes for admin or teacher
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scheduleSchema.index({ teacher: 1, dayOfWeek: 1 });
scheduleSchema.index({ teacher: 1, isAvailable: 1 });
scheduleSchema.index({ dayOfWeek: 1, startTime: 1 });

// Virtual for schedule duration
scheduleSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
});

// Virtual for available capacity
scheduleSchema.virtual('availableCapacity').get(function() {
  return Math.max(0, this.maxStudents - this.currentBookings);
});

// Virtual for checking if schedule is fully booked
scheduleSchema.virtual('isFullyBooked').get(function() {
  return this.currentBookings >= this.maxStudents;
});

// Pre-save middleware to validate time logic
scheduleSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const start = this.startTime.split(':').map(Number);
    const end = this.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (startMinutes >= endMinutes) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Static method to find available schedules for a specific day and time
scheduleSchema.statics.findAvailable = function(dayOfWeek, startTime, endTime, subject = null) {
  const query = {
    dayOfWeek,
    isAvailable: true,
    startTime: { $lte: startTime },
    endTime: { $gte: endTime }
  };
  
  if (subject) {
    query.subjects = subject;
  }
  
  return this.find(query).populate('teacher');
};

// Static method to find teacher schedules by date range
scheduleSchema.statics.findByTeacherAndDateRange = function(teacherId, startDate, endDate) {
  return this.find({
    teacher: teacherId,
    effectiveFrom: { $lte: endDate },
    $or: [
      { effectiveUntil: { $gte: startDate } },
      { effectiveUntil: { $exists: false } }
    ]
  });
};

// Static method to find conflicting schedules
scheduleSchema.statics.findConflicts = function(teacherId, dayOfWeek, startTime, endTime, excludeId = null) {
  const query = {
    teacher: teacherId,
    dayOfWeek,
    isAvailable: true,
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

// Method to check if a time slot is available
scheduleSchema.methods.isTimeSlotAvailable = function(startTime, endTime) {
  if (!this.isAvailable) return false;
  
  const scheduleStart = this.startTime.split(':').map(Number);
  const scheduleEnd = this.endTime.split(':').map(Number);
  const requestedStart = startTime.split(':').map(Number);
  const requestedEnd = endTime.split(':').map(Number);
  
  const scheduleStartMinutes = scheduleStart[0] * 60 + scheduleStart[1];
  const scheduleEndMinutes = scheduleEnd[0] * 60 + scheduleEnd[1];
  const requestedStartMinutes = requestedStart[0] * 60 + requestedStart[1];
  const requestedEndMinutes = requestedEnd[0] * 60 + requestedEnd[1];
  
  // Check if requested time falls within schedule
  if (requestedStartMinutes < scheduleStartMinutes || requestedEndMinutes > scheduleEndMinutes) {
    return false;
  }
  
  // Check if there are any breaks that conflict
  for (const breakTime of this.breaks) {
    const breakStart = breakTime.startTime.split(':').map(Number);
    const breakEnd = breakTime.endTime.split(':').map(Number);
    const breakStartMinutes = breakStart[0] * 60 + breakStart[1];
    const breakEndMinutes = breakEnd[0] * 60 + breakEnd[1];
    
    if (requestedStartMinutes < breakEndMinutes && requestedEndMinutes > breakStartMinutes) {
      return false;
    }
  }
  
  return true;
};

// Method to increment current bookings
scheduleSchema.methods.incrementBookings = function() {
  if (this.currentBookings < this.maxStudents) {
    this.currentBookings += 1;
    return this.save();
  }
  throw new Error('Schedule is fully booked');
};

// Method to decrement current bookings
scheduleSchema.methods.decrementBookings = function() {
  if (this.currentBookings > 0) {
    this.currentBookings -= 1;
    return this.save();
  }
  throw new Error('No bookings to decrement');
};

module.exports = mongoose.model('Schedule', scheduleSchema); 