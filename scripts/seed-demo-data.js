const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Student = require('../models/Student');

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
    isActive: true
  },
  {
    email: 'parent2@tutoring.com',
    password: 'parent123',
    firstName: 'David',
    lastName: 'Wilson',
    role: 'parent',
    phone: '+1234567894',
    isActive: true
  }
];

// Demo students data
const demoStudents = [
  {
    firstName: 'Emma',
    lastName: 'Smith',
    dateOfBirth: '2009-05-15',
    grade: '9th Grade',
    subjects: ['Mathematics', 'English'],
    notes: 'Emma is a bright student who excels in mathematics.',
    emergencyContact: {
      name: 'Jennifer Smith',
      phone: '+1234567893',
      relationship: 'Mother'
    },
    preferences: {
      learningStyle: 'visual',
      preferredTimes: [
        { day: 'monday', startTime: '15:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '15:00', endTime: '17:00' }
      ]
    }
  },
  {
    firstName: 'Lucas',
    lastName: 'Smith',
    dateOfBirth: '2011-08-22',
    grade: '7th Grade',
    subjects: ['Mathematics', 'Science'],
    notes: 'Lucas shows great interest in science experiments.',
    emergencyContact: {
      name: 'Jennifer Smith',
      phone: '+1234567893',
      relationship: 'Mother'
    },
    preferences: {
      learningStyle: 'kinesthetic',
      preferredTimes: [
        { day: 'tuesday', startTime: '16:00', endTime: '18:00' },
        { day: 'thursday', startTime: '16:00', endTime: '18:00' }
      ]
    }
  },
  {
    firstName: 'Sophia',
    lastName: 'Wilson',
    dateOfBirth: '2007-03-10',
    grade: '11th Grade',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    notes: 'Sophia is preparing for college applications.',
    emergencyContact: {
      name: 'David Wilson',
      phone: '+1234567894',
      relationship: 'Father'
    },
    preferences: {
      learningStyle: 'mixed',
      preferredTimes: [
        { day: 'monday', startTime: '17:00', endTime: '19:00' },
        { day: 'friday', startTime: '14:00', endTime: '16:00' }
      ]
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-center-scheduler';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    const allowDestructive = process.env.ALLOW_DESTRUCTIVE_SEED === 'true';
    const isLocal = /mongodb:\/\/(localhost|127\.0\.0\.1)/.test(mongoUri);
    if (!allowDestructive && !isLocal) {
      throw new Error('Refusing to delete collections on non-local DB without ALLOW_DESTRUCTIVE_SEED=true');
    }
    await User.deleteMany({});
    await Student.deleteMany({});
    console.log('Cleared existing data');
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

    // Find parent users
    const parent1 = createdUsers.find(u => u.email === 'parent@tutoring.com');
    const parent2 = createdUsers.find(u => u.email === 'parent2@tutoring.com');

    // Create students with parent references
    const studentsWithParents = demoStudents.map((student, index) => {
      if (index < 2) {
        // First two students belong to parent1 (Jennifer Smith)
        return { ...student, parent: parent1._id };
      } else {
        // Third student belongs to parent2 (David Wilson)
        return { ...student, parent: parent2._id };
      }
    });

    // Insert students
    const createdStudents = await Student.insertMany(studentsWithParents);
    console.log(`Created ${createdStudents.length} demo students`);

    // Display created users
    console.log('\nDemo users created:');
    createdUsers.forEach(user => {
      console.log(`- ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
    });

    // Display created students
    console.log('\nDemo students created:');
    createdStudents.forEach(student => {
      const parent = createdUsers.find(u => u._id.toString() === student.parent.toString());
      console.log(`- ${student.firstName} ${student.lastName} (Grade ${student.grade}) - Parent: ${parent.firstName} ${parent.lastName}`);
    });

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Admin: admin@tutoring.com / admin123');
    console.log('Teacher: teacher@tutoring.com / teacher123');
    console.log('Parent: parent@tutoring.com / parent123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }}

// Run the seeding function
seedDatabase(); 