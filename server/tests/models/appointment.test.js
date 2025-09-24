const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const Student = require('../../models/Student');

// Test database setup
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring_test';

describe('Appointment Model', () => {
  let teacherId;
  let studentId;

  beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  beforeEach(async () => {
    // Clear test database
    await User.deleteMany({});
    await Student.deleteMany({});
    await Appointment.deleteMany({});

    // Create test users
    const teacher = new User({
      email: 'teacher@test.com',
      password: '$2a$12$test.hash',
      role: 'teacher',
      firstName: 'Test',
      lastName: 'Teacher',
      phone: '+1234567890',
      isActive: true,
      subjects: ['Mathematics']
    });
    await teacher.save();
    teacherId = teacher._id;

    const parent = new User({
      email: 'parent@test.com',
      password: '$2a$12$test.hash',
      role: 'parent',
      firstName: 'Test',
      lastName: 'Parent',
      phone: '+1234567891',
      isActive: true
    });
    await parent.save();

    const student = new Student({
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: new Date('2010-01-01'),
      grade: '8th Grade',
      subjects: ['Mathematics'],
      parent: parent._id,
      isActive: true
    });
    await student.save();
    studentId = student._id;
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Duration Calculation', () => {
    it('should calculate duration correctly for 1 hour appointment', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      });

      await appointment.save();
      expect(appointment.duration).toBe(60); // 60 minutes
    });

    it('should calculate duration correctly for 30 minute appointment', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '14:00',
        endTime: '14:30'
      });

      await appointment.save();
      expect(appointment.duration).toBe(30); // 30 minutes
    });

    it('should calculate duration correctly for 2.5 hour appointment', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '09:00',
        endTime: '11:30'
      });

      await appointment.save();
      expect(appointment.duration).toBe(150); // 2.5 hours = 150 minutes
    });

    it('should calculate duration correctly for complex time', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '09:15',
        endTime: '11:45'
      });

      await appointment.save();
      expect(appointment.duration).toBe(150); // 2 hours 30 minutes = 150 minutes
    });

    it('should handle single digit hours correctly', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '9:00',
        endTime: '10:30'
      });

      await appointment.save();
      expect(appointment.duration).toBe(90); // 1.5 hours = 90 minutes
    });

    it('should throw error when end time is before start time', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '11:00',
        endTime: '10:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('End time must be after start time');
      }
    });

    it('should throw error when end time equals start time', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '10:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('End time must be after start time');
      }
    });

    it('should throw error when startTime is missing', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        endTime: '11:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Start time is required');
      }
    });

    it('should throw error when endTime is missing', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('End time is required');
      }
    });

    it('should throw error for invalid time format', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '25:00', // Invalid hour
        endTime: '11:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Please enter a valid time format');
      }
    });

    it('should throw error for invalid time format in endTime', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:70' // Invalid minutes
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Please enter a valid time format');
      }
    });

    it('should handle edge case with 23:59 to 00:01 (next day)', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '23:59',
        endTime: '00:01'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('End time must be after start time');
      }
    });
  });

  describe('Model Validation', () => {
    it('should validate required fields', async () => {
      const appointment = new Appointment({});

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.student).toBeDefined();
        expect(error.errors.teacher).toBeDefined();
        expect(error.errors.subject).toBeDefined();
        expect(error.errors.scheduledDate).toBeDefined();
        expect(error.errors.startTime).toBeDefined();
        expect(error.errors.endTime).toBeDefined();
      }
    });

    it('should validate subject is not empty', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: '', // Empty subject
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.subject).toBeDefined();
      }
    });

    it('should validate time format with regex', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:0', // Invalid format
        endTime: '11:00'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.startTime).toBeDefined();
      }
    });

    it('should validate status enum values', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        status: 'invalid-status'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.status).toBeDefined();
      }
    });

    it('should validate location enum values', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        location: 'invalid-location'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.location).toBeDefined();
      }
    });

    it('should validate notes length limit', async () => {
      const longNotes = 'a'.repeat(501); // Exceeds 500 character limit
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        notes: longNotes
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.notes).toBeDefined();
      }
    });

    it('should validate duration min/max limits', async () => {
      // Test minimum duration (should be calculated correctly)
      const shortAppointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '10:14' // 14 minutes - below minimum
      });

      try {
        await shortAppointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.duration).toBeDefined();
        expect(error.errors.duration.message).toContain('Duration must be at least 15 minutes');
      }
    });

    it('should set default values correctly', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      });

      await appointment.save();

      expect(appointment.status).toBe('available');
      expect(appointment.location).toBe('in-person');
      expect(appointment.attendance).toBe('present');
      expect(appointment.completionStatus).toBe('not-started');
      expect(appointment.isPaid).toBe(false);
      expect(appointment.isRecurring).toBe(false);
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate isToday correctly for today', async () => {
      const today = new Date();
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: today,
        startTime: '10:00',
        endTime: '11:00'
      });

      await appointment.save();
      expect(appointment.isToday).toBe(true);
    });

    it('should calculate isToday correctly for different day', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: tomorrow,
        startTime: '10:00',
        endTime: '11:00'
      });

      await appointment.save();
      expect(appointment.isToday).toBe(false);
    });
  });
});
