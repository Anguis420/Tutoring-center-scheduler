// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Student = require('./models/Student');

// MongoDB Atlas connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Please set MONGODB_URI in your .env file or environment variables');
  process.exit(1);
}

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
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '17:00' }
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
      { day: 'monday', startTime: '10:00', endTime: '18:00' },
      { day: 'tuesday', startTime: '10:00', endTime: '18:00' },
      { day: 'wednesday', startTime: '10:00', endTime: '18:00' },
      { day: 'thursday', startTime: '10:00', endTime: '18:00' },
      { day: 'friday', startTime: '10:00', endTime: '18:00' }
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

async function seedAtlasDatabase() {
  try {
    console.log('🌐 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');

    // Add confirmation prompt for safety
    // Check for CI bypass or interactive environment
    const seedConfirm = process.env.SEED_CONFIRM;
    
    if (seedConfirm) {
      // CI bypass - check if confirmation is provided
      if (seedConfirm.toLowerCase() === 'yes') {
        console.log('✅ SEED_CONFIRM=yes detected, proceeding without prompt');
      } else {
        console.log('❌ SEED_CONFIRM is set but not "yes", operation cancelled');
        process.exit(0);
      }
    } else {
      // Interactive mode - check if we have a TTY
      if (!process.stdin.isTTY) {
        console.error('❌ Non-interactive environment detected. To run in CI or non-interactive mode, set SEED_CONFIRM=yes');
        process.exit(1);
      }
      
      // Use readline/promises for cleaner async/await
      const { createInterface } = require('readline/promises');
      
      try {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await rl.question('⚠️  This will delete ALL existing users and students. Continue? (yes/no): ');
        
        if (answer.toLowerCase() !== 'yes') {
          console.log('❌ Operation cancelled');
          rl.close();
          process.exit(0);
        }
        
        rl.close();
      } catch (error) {
        console.error('❌ Error with readline interface:', error.message);
        throw error;
      }
    }

    await User.deleteMany({});
    await Student.deleteMany({});
    console.log('✅ Existing data cleared');

    // Hash passwords for all users
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
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Find parent users
    const parent1 = createdUsers.find(u => u.email === 'parent@tutoring.com');
    const parent2 = createdUsers.find(u => u.email === 'parent2@tutoring.com');

    // Create students with parent references
    const studentsWithParents = demoStudents.map((student, index) => {
      if (index < 2) {
        return { ...student, parent: parent1._id };
      } else {
        return { ...student, parent: parent2._id };
      }
    });

    // Insert students
    const createdStudents = await Student.insertMany(studentsWithParents);
    console.log(`✅ Created ${createdStudents.length} demo students`);

    // Display created users
    console.log('\n👥 Demo users created:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
    });

    // Display created students
    console.log('\n🎓 Demo students created:');
    createdStudents.forEach(student => {
      const parent = createdUsers.find(u => u._id.toString() === student.parent.toString());
      console.log(`  - ${student.firstName} ${student.lastName} (Grade ${student.grade}) - Parent: ${parent.firstName} ${parent.lastName}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Demo credentials for testing:');
    console.log('  👨‍💼 Admin: admin@tutoring.com / admin123');
    console.log('  👩‍🏫 Teacher: teacher@tutoring.com / teacher123');
    console.log('  👨‍🏫 Teacher 2: teacher2@tutoring.com / teacher123');
    console.log('  👩‍👧‍👦 Parent: parent@tutoring.com / parent123');
    console.log('  👨‍👧 Parent 2: parent2@tutoring.com / parent123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('🔍 Check your MongoDB Atlas connection string and network access settings');
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the seeding function
console.log('🚀 Starting MongoDB Atlas database seeding...');
seedAtlasDatabase();
