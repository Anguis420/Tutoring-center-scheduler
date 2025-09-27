#!/usr/bin/env node

/**
 * Migration script to update existing 'scheduled' appointment statuses to 'available'
 * This addresses the breaking change where the default status changed from 'scheduled' to 'available'
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function migrateAppointmentStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all appointments with 'scheduled' status
    const scheduledAppointments = await Appointment.find({ status: 'scheduled' });
    console.log(`Found ${scheduledAppointments.length} appointments with 'scheduled' status`);

    if (scheduledAppointments.length === 0) {
      console.log('No appointments to migrate');
      return;
    }

    // Update all 'scheduled' appointments to 'available'
    const result = await Appointment.updateMany(
      { status: 'scheduled' },
      { $set: { status: 'available' } }
    );

    console.log(`Successfully updated ${result.modifiedCount} appointments from 'scheduled' to 'available'`);

    // Verify the migration
    const remainingScheduled = await Appointment.countDocuments({ status: 'scheduled' });
    const availableCount = await Appointment.countDocuments({ status: 'available' });
    
    console.log(`Verification:`);
    console.log(`- Remaining 'scheduled' appointments: ${remainingScheduled}`);
    console.log(`- Total 'available' appointments: ${availableCount}`);

    if (remainingScheduled === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Warning: Some appointments still have "scheduled" status');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAppointmentStatus()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAppointmentStatus;
