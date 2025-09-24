const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Appointment = require('../../models/Appointment');
const bcrypt = require('bcryptjs');

describe('Appointment Role-Based Access Control', () => {
  let adminToken, teacherToken, parentToken;
  let adminUser, teacherUser, parentUser;
  let student;
  let testAppointment;

  beforeAll(async () => {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring_test');
    }
  });

  beforeEach(async () => {
    // Clear appointments and students but keep users
    await Student.deleteMany({});
    await Appointment.deleteMany({});

    // Check if users exist, if not create them
    adminUser = await User.findOne({ email: 'admin@tutoring.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = await User.create({
        email: 'admin@tutoring.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890',
        isActive: true
      });
    }

    teacherUser = await User.findOne({ email: 'teacher@tutoring.com' });
    if (!teacherUser) {
      const hashedPassword = await bcrypt.hash('teacher123', 12);
      teacherUser = await User.create({
        email: 'teacher@tutoring.com',
        password: hashedPassword,
        firstName: 'Teacher',
        lastName: 'User',
        role: 'teacher',
        phone: '+1234567891',
        subjects: ['Mathematics'],
        isActive: true
      });
    }

    parentUser = await User.findOne({ email: 'parent@tutoring.com' });
    if (!parentUser) {
      const hashedPassword = await bcrypt.hash('parent123', 12);
      parentUser = await User.create({
        email: 'parent@tutoring.com',
        password: hashedPassword,
        firstName: 'Parent',
        lastName: 'User',
        role: 'parent',
        phone: '+1234567892',
        isActive: true
      });
    }

    // Create test student
    student = await Student.create({
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: '2010-01-01',
      age: 13,
      grade: '8th Grade',
      subjects: ['Mathematics'],
      parent: parentUser._id,
      emergencyContact: {
        name: 'Parent User',
        phone: '+1234567892',
        relationship: 'Parent'
      }
    });

    // Login and get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tutoring.com', password: 'admin123' });
    
    if (adminLogin.status !== 200) {
      console.error('Admin login failed:', adminLogin.status, adminLogin.body);
    }
    adminToken = adminLogin.body.token;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@tutoring.com', password: 'teacher123' });
    
    if (teacherLogin.status !== 200) {
      console.error('Teacher login failed:', teacherLogin.status, teacherLogin.body);
    }
    teacherToken = teacherLogin.body.token;

    const parentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@tutoring.com', password: 'parent123' });
    
    if (parentLogin.status !== 200) {
      console.error('Parent login failed:', parentLogin.status, parentLogin.body);
    }
    parentToken = parentLogin.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Admin Appointment Management', () => {
    test('Admin should be able to create appointments with teacher assignments', async () => {
      const appointmentData = {
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: '2024-02-15',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        location: 'in-person',
        notes: 'Admin created appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.appointment).toBeDefined();
      expect(response.body.appointment.teacher.toString()).toBe(teacherUser._id.toString());
      expect(response.body.appointment.status).toBe('available'); // Available for booking
    });

    test('Admin should be able to update appointment details', async () => {
      // First create an appointment
      const appointment = await Appointment.create({
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: new Date('2024-02-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        status: 'available'
      });

      const updateData = {
        subject: 'Advanced Mathematics',
        notes: 'Updated by admin'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.appointment.subject).toBe('Advanced Mathematics');
    });

    test('Admin should be able to delete appointments', async () => {
      const appointment = await Appointment.create({
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: new Date('2024-02-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        status: 'available'
      });

      const response = await request(app)
        .delete(`/api/appointments/${appointment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const deletedAppointment = await Appointment.findById(appointment._id);
      expect(deletedAppointment).toBeNull();
    });
  });

  describe('Teacher Read-Only Access', () => {
    beforeEach(async () => {
      // Create test appointment assigned to teacher
      testAppointment = await Appointment.create({
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: new Date('2024-02-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        status: 'available'
      });
    });

    test('Teacher should be able to view their assigned appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/teacher')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0]._id.toString()).toBe(testAppointment._id.toString());
    });

    test('Teacher should NOT be able to create appointments', async () => {
      const appointmentData = {
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: '2024-02-16',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(appointmentData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });

    test('Teacher should NOT be able to update appointments', async () => {
      const updateData = {
        subject: 'Updated Subject'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });

    test('Teacher should NOT be able to delete appointments', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });
  });

  describe('Parent Booking-Only Access', () => {
    beforeEach(async () => {
      // Create available appointment for booking
      testAppointment = await Appointment.create({
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: new Date('2024-02-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        status: 'available'
      });
    });

    test('Parent should be able to view available appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/available')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].status).toBe('available');
    });

    test('Parent should be able to book available appointments', async () => {
      const bookingData = {
        appointmentId: testAppointment._id,
        student: student._id,
        notes: 'Parent booking notes'
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(bookingData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully booked');
      
      // Verify appointment status changed to booked
      const updatedAppointment = await Appointment.findById(testAppointment._id);
      expect(updatedAppointment.status).toBe('booked');
    });

    test('Parent should NOT be able to create appointments', async () => {
      const appointmentData = {
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: '2024-02-16',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(appointmentData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });

    test('Parent should NOT be able to update appointment details', async () => {
      const updateData = {
        subject: 'Updated Subject'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });

    test('Parent should NOT be able to delete appointments', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Admin access required');
    });

    test('Parent should NOT be able to book already booked appointments', async () => {
      // First book the appointment
      await Appointment.findByIdAndUpdate(testAppointment._id, { 
        status: 'booked',
        bookedBy: parentUser._id
      });

      const bookingData = {
        appointmentId: testAppointment._id,
        student: student._id,
        notes: 'Second booking attempt'
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already booked');
    });
  });

  describe('Appointment Status Management', () => {
    test('Appointment should have correct status flow: available -> booked -> completed', async () => {
      const appointment = await Appointment.create({
        student: student._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        scheduledDate: new Date('2024-02-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        duration: 60,
        status: 'available'
      });

      // Initially available
      expect(appointment.status).toBe('available');

      // Book the appointment
      await Appointment.findByIdAndUpdate(appointment._id, { 
        status: 'booked',
        bookedBy: parentUser._id
      });

      const bookedAppointment = await Appointment.findById(appointment._id);
      expect(bookedAppointment.status).toBe('booked');

      // Complete the appointment (admin only)
      const response = await request(app)
        .put(`/api/appointments/${appointment._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      
      const completedAppointment = await Appointment.findById(appointment._id);
      expect(completedAppointment.status).toBe('completed');
    });
  });
});
