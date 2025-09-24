const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

// Import models and routes
const User = require('../../models/User');
const authRoutes = require('../../routes/auth');

// Create a test app instance
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/auth', authRoutes);
  
  return app;
};

describe('Login Authentication Tests', () => {
  let app;
  let testUsers = [];

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    
    // Create test app
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear existing users
    await User.deleteMany({});

    // Create test users with demo credentials (using plain passwords - middleware will hash them)
    const demoUsers = [
      {
        email: 'admin@tutoring.com',
        password: 'admin123', // Plain password - middleware will hash it
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890',
        isActive: true
      },
      {
        email: 'teacher@tutoring.com',
        password: 'teacher123', // Plain password - middleware will hash it
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'teacher',
        phone: '+1234567891',
        subjects: ['Mathematics', 'Physics'],
        qualifications: 'MSc in Mathematics',
        experience: 5,
        hourlyRate: 45,
        isActive: true
      },
      {
        email: 'parent@tutoring.com',
        password: 'parent123', // Plain password - middleware will hash it
        firstName: 'John',
        lastName: 'Doe',
        role: 'parent',
        phone: '+1234567892',
        isActive: true
      },
      {
        email: 'teacher2@tutoring.com',
        password: 'teacher123', // Plain password - middleware will hash it
        firstName: 'Mike',
        lastName: 'Smith',
        role: 'teacher',
        phone: '+1234567893',
        subjects: ['Chemistry', 'Biology'],
        qualifications: 'PhD in Chemistry',
        experience: 8,
        hourlyRate: 50,
        isActive: true
      },
      {
        email: 'parent2@tutoring.com',
        password: 'parent123', // Plain password - middleware will hash it
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'parent',
        phone: '+1234567894',
        isActive: true
      }
    ];

    // Create users (middleware will hash passwords automatically)
    testUsers = await Promise.all(
      demoUsers.map(user => User.create(user))
    );

    console.log(`✅ Created ${testUsers.length} test users for login testing`);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Successful Login Tests', () => {
    test('Admin user should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@tutoring.com');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.firstName).toBe('Admin');
      expect(response.body.user.lastName).toBe('User');
      expect(response.body.user.isActive).toBe(true);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    test('Teacher user should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@tutoring.com',
          password: 'teacher123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('teacher@tutoring.com');
      expect(response.body.user.role).toBe('teacher');
      expect(response.body.user.firstName).toBe('Sarah');
      expect(response.body.user.lastName).toBe('Johnson');
      expect(response.body.user.subjects).toEqual(['Mathematics', 'Physics']);
      expect(response.body.user.isActive).toBe(true);
    });

    test('Parent user should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'parent@tutoring.com',
          password: 'parent123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('parent@tutoring.com');
      expect(response.body.user.role).toBe('parent');
      expect(response.body.user.firstName).toBe('John');
      expect(response.body.user.lastName).toBe('Doe');
      expect(response.body.user.isActive).toBe(true);
    });

    test('Second teacher user should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher2@tutoring.com',
          password: 'teacher123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('teacher2@tutoring.com');
      expect(response.body.user.role).toBe('teacher');
      expect(response.body.user.firstName).toBe('Mike');
      expect(response.body.user.lastName).toBe('Smith');
      expect(response.body.user.subjects).toEqual(['Chemistry', 'Biology']);
    });

    test('Second parent user should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'parent2@tutoring.com',
          password: 'parent123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('parent2@tutoring.com');
      expect(response.body.user.role).toBe('parent');
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.user.lastName).toBe('Smith');
    });
  });

  describe('Failed Login Tests', () => {
    test('Should fail with incorrect email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@tutoring.com',
          password: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Should fail with empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: 'admin123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    test('Should fail with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    test('Should fail with missing email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    test('Should fail with missing password field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    test('Should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'admin123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Inactive User Tests', () => {
    test('Should fail to login with inactive user', async () => {
      // Create an inactive user
      await User.create({
        email: 'inactive@tutoring.com',
        password: 'test123', // Plain password - middleware will hash it
        firstName: 'Inactive',
        lastName: 'User',
        role: 'teacher',
        phone: '+1234567899',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@tutoring.com',
          password: 'test123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Account is deactivated');
    });
  });

  describe('Token Validation Tests', () => {
    let adminToken;

    beforeEach(async () => {
      // Login as admin to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: 'admin123'
        });
      
      adminToken = loginResponse.body.token;
    });

    test('Should validate token and return user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@tutoring.com');
      expect(response.body.user.role).toBe('admin');
    });

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token');
    });

    test('Should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('Password Security Tests', () => {
    test('Should not return password in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user.password).toBeUndefined();
    });

    test('Should handle case sensitivity correctly (emails are normalized)', async () => {
      // Test with uppercase email - should work because emails are normalized to lowercase
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ADMIN@TUTORING.COM',
          password: 'admin123'
        });

      expect(response1.status).toBe(200);
      expect(response1.body.user.email).toBe('admin@tutoring.com');

      // Test with mixed case email - should work because emails are normalized to lowercase
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'Admin@Tutoring.com',
          password: 'admin123'
        });

      expect(response2.status).toBe(200);
      expect(response2.body.user.email).toBe('admin@tutoring.com');
    });
  });

  describe('Concurrent Login Tests', () => {
    test('Multiple users should be able to login simultaneously', async () => {
      const loginPromises = [
        request(app).post('/api/auth/login').send({
          email: 'admin@tutoring.com',
          password: 'admin123'
        }),
        request(app).post('/api/auth/login').send({
          email: 'teacher@tutoring.com',
          password: 'teacher123'
        }),
        request(app).post('/api/auth/login').send({
          email: 'parent@tutoring.com',
          password: 'parent123'
        })
      ];

      const responses = await Promise.all(loginPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      });

      // Verify all tokens are different
      const tokens = responses.map(r => r.body.token);
      const uniqueTokens = [...new Set(tokens)];
      expect(uniqueTokens).toHaveLength(3);
    });
  });

  describe('Login Performance Tests', () => {
    test('Login should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tutoring.com',
          password: 'admin123'
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Demo Credentials Verification', () => {
    test('All demo credentials should work as expected', async () => {
      const credentials = [
        { email: 'admin@tutoring.com', password: 'admin123', role: 'admin' },
        { email: 'teacher@tutoring.com', password: 'teacher123', role: 'teacher' },
        { email: 'parent@tutoring.com', password: 'parent123', role: 'parent' },
        { email: 'teacher2@tutoring.com', password: 'teacher123', role: 'teacher' },
        { email: 'parent2@tutoring.com', password: 'parent123', role: 'parent' }
      ];

      for (const cred of credentials) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(cred);

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(cred.email);
        expect(response.body.user.role).toBe(cred.role);
        expect(response.body.token).toBeDefined();
      }
    });
  });
});