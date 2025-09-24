#!/bin/bash

# Test runner script for appointment creation tests
# This script sets up the test environment and runs the tests

echo "🧪 Starting Appointment Creation Tests..."
echo "========================================"

# Set test environment
export NODE_ENV=test
export MONGODB_TEST_URI=mongodb://localhost:27017/tutoring_test

# Check if MongoDB is running
echo "📡 Checking MongoDB connection..."
if ! mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   On Windows: net start MongoDB"
    exit 1
fi

echo "✅ MongoDB is running"

# Install test dependencies if not already installed
echo "📦 Installing test dependencies..."
npm install --silent

# Run the tests
echo "🚀 Running appointment creation tests..."
echo ""

# Run specific test files
echo "Testing Appointment Model..."
npx jest tests/models/appointment.test.js --config=tests/jest.config.js

echo ""
echo "Testing Appointment API Routes..."
npx jest tests/routes/appointments.test.js --config=tests/jest.config.js

echo ""
echo "🎉 All tests completed!"
echo "========================================"
