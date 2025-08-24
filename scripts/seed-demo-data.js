const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Demo data
const demoUsers = [
  {
    email: 'admin@tutoring.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phone: '+1234567890',
    isActive: true
  },
  {
    email: 'teacher@tutoring.com',
    password: 'teacher123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'teacher',
    phone: '+1234567891',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    qualifications: 'MSc in Mathematics, 5 years teaching experience',
    experience: 5,
    hourlyRate: 45,
    availability: [
      {
        day: 'monday',
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        day: 'tuesday',
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        day: 'wednesday',
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        day: 'thursday',
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        day: 'friday',
        startTime: '09:00',
        endTime: '17:00'
      }
    ],
    isActive: true
  },
  {
    email: 'teacher2@tutoring.com',
    password: 'teacher123',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'teacher',
    phone: '+1234567892',
    subjects: ['English', 'Literature', 'Writing'],
    qualifications: 'PhD in English Literature, 8 years teaching experience',
    experience: 8,
    hourlyRate: 50,
    availability: [
      {
        day: 'monday',
        startTime: '10:00',
        endTime: '18:00'
      },
      {
        day: 'tuesday',
        startTime: '10:00',
        endTime: '18:00'
      },
      {
        day: 'wednesday',
        startTime: '10:00',
        endTime: '18:00'
      },
      {
        day: 'thursday',
        startTime: '10:00',
        endTime: '18:00'
      },
      {
        day: 'friday',
        startTime: '10:00',
        endTime: '18:00'
      }
    ],
    isActive: true
  },
  {
    email: 'parent@tutoring.com',
    password: 'parent123',
    firstName: 'Jennifer',
    lastName: 'Smith',
    role: 'parent',
    phone: '+1234567893',
    children: [
      {
        name: 'Emma Smith',
        age: 14,
        grade: '9th Grade',
        subjects: ['Mathematics', 'English']
      },
      {
        name: 'Lucas Smith',
        age: 12,
        grade: '7th Grade',
        subjects: ['Mathematics', 'Science']
      }
    ],
    isActive: true
  },
  {
    email: 'parent2@tutoring.com',
    password: 'parent123',
    firstName: 'David',
    lastName: 'Wilson',
    role: 'parent',
    phone: '+1234567894',
    children: [
      {
        name: 'Sophia Wilson',
        age: 16,
        grade: '11th Grade',
        subjects: ['Physics', 'Chemistry', 'Mathematics']
      }
    ],
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-center-scheduler');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      demoUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    // Insert users
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} demo users`);

    // Display created users
    console.log('\nDemo users created:');
    createdUsers.forEach(user => {
      console.log(`- ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
    });

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Admin: admin@tutoring.com / admin123');
    console.log('Teacher: teacher@tutoring.com / teacher123');
    console.log('Parent: parent@tutoring.com / parent123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase(); 