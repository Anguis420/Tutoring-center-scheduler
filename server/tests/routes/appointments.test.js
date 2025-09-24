const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Appointment = require('../../models/Appointment');

// Test database setup
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring_test';

describe('Appointment Creation API', () => {
  let adminToken;
  let teacherId;
  let studentId;
  let adminId;

  beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Clear test database
    await User.deleteMany({});
    await Student.deleteMany({});
    await Appointment.deleteMany({});
  });

  beforeEach(async () => {
    // Create test users
    const admin = new User({
      email: 'admin@test.com',
      password: 'testpassword', // Plain password - will be hashed by pre-save hook
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isActive: true
    });
    await admin.save();
    adminId = admin._id;

    const teacher = new User({
      email: 'teacher@test.com',
      password: 'testpassword',
      role: 'teacher',
      firstName: 'Test',
      lastName: 'Teacher',
      phone: '+1234567891',
      isActive: true,
      subjects: ['Mathematics', 'Physics']
    });
    await teacher.save();
    teacherId = teacher._id;

    const parent = new User({
      email: 'parent@test.com',
      password: 'testpassword',
      role: 'parent',
      firstName: 'Test',
      lastName: 'Parent',
      phone: '+1234567892',
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

    // Login as admin to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'testpassword'
      });

    adminToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Student.deleteMany({});
    await Appointment.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/appointments', () => {
    it('should create an appointment successfully with valid data', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.message).toBe('Appointment created successfully');
      expect(response.body.appointment).toBeDefined();
      expect(response.body.appointment.subject).toBe('Mathematics');
      expect(response.body.appointment.duration).toBe(60); // 60 minutes
      expect(response.body.appointment.status).toBe('available');
      expect(response.body.appointment.location).toBe('in-person');
    });

    it('should calculate duration automatically from start and end time', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '14:30',
        endTime: '16:00',
        notes: 'Test duration calculation'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.appointment.duration).toBe(90); // 1.5 hours = 90 minutes
    });

    it('should set default location to in-person when not provided', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.appointment.location).toBe('in-person');
    });

    it('should accept custom location when provided', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        location: 'online',
        notes: 'Online session'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.appointment.location).toBe('online');
    });

    it('should populate student and teacher details', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.appointment.student).toBeDefined();
      expect(response.body.appointment.teacher).toBeDefined();
      expect(response.body.appointment.teacher.firstName).toBe('Test');
      expect(response.body.appointment.teacher.lastName).toBe('Teacher');
    });

    it('should reject appointment creation without authentication', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);
    });

    it('should reject appointment creation with non-admin user', async () => {
      // Create a teacher user and get their token
      const teacherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@test.com',
          password: 'testpassword'
        });

      const teacherToken = teacherLoginResponse.body.token;

      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(appointmentData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing student, teacher, subject, scheduledDate, startTime, endTime
        notes: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate student ID format', async () => {
      const appointmentData = {
        student: 'invalid-id',
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate teacher ID format', async () => {
      const appointmentData = {
        student: studentId,
        teacher: 'invalid-id',
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate time format', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '25:00', // Invalid time
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate date format', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: 'invalid-date',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate location enum values', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        location: 'invalid-location'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate notes length limit', async () => {
      const longNotes = 'a'.repeat(501); // Exceeds 500 character limit
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        notes: longNotes
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 for non-existent student', async () => {
      const nonExistentStudentId = new mongoose.Types.ObjectId();
      const appointmentData = {
        student: nonExistentStudentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(404);

      expect(response.body.message).toBe('Student or teacher not found');
    });

    it('should return 404 for non-existent teacher', async () => {
      const nonExistentTeacherId = new mongoose.Types.ObjectId();
      const appointmentData = {
        student: studentId,
        teacher: nonExistentTeacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(404);

      expect(response.body.message).toBe('Student or teacher not found');
    });

    it('should return 400 for invalid teacher role', async () => {
      // Create a user with non-teacher role
      const nonTeacher = new User({
        email: 'nonteacher@test.com',
        password: '$2a$12$test.hash',
        role: 'parent',
        firstName: 'Non',
        lastName: 'Teacher',
        phone: '+1234567893',
        isActive: true
      });
      await nonTeacher.save();

      const appointmentData = {
        student: studentId,
        teacher: nonTeacher._id,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toBe('Invalid teacher role');
    });

    it('should handle end time before start time in duration calculation', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '11:00',
        endTime: '10:00' // End time before start time
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toContain('Duration');
    });

    it('should handle invalid time format in duration calculation', async () => {
      const appointmentData = {
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: 'invalid-time',
        endTime: '11:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toContain('Duration');
    });
  });

  describe('Appointment Model Duration Calculation', () => {
    it('should calculate duration correctly in pre-save hook', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '09:30',
        endTime: '11:15'
      });

      await appointment.save();

      expect(appointment.duration).toBe(105); // 1 hour 45 minutes = 105 minutes
    });

    it('should handle edge case with same start and end time', async () => {
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

    it('should handle midnight crossover', async () => {
      const appointment = new Appointment({
        student: studentId,
        teacher: teacherId,
        subject: 'Mathematics',
        scheduledDate: '2024-12-25',
        startTime: '23:30',
        endTime: '00:30'
      });

      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('End time must be after start time');
      }
    });
  });
});
