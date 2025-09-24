# Appointment Creation Tests

This directory contains comprehensive unit tests for the appointment creation functionality in the Tutoring Center Scheduler.

## 📁 Test Structure

```
tests/
├── models/
│   └── appointment.test.js          # Appointment model unit tests
├── routes/
│   └── appointments.test.js         # Appointment API route tests
├── setup.js                         # Test configuration
├── jest.config.js                   # Jest configuration
├── run-tests.sh                     # Unix/Linux test runner
├── run-tests.bat                    # Windows test runner
└── README.md                        # This file
```

## 🧪 Test Coverage

### Appointment Model Tests (`models/appointment.test.js`)
- **Duration Calculation**: Tests automatic duration calculation from start/end times
- **Time Validation**: Tests various time format validations
- **Edge Cases**: Tests midnight crossover, invalid times, etc.
- **Model Validation**: Tests required fields, enum values, length limits
- **Virtual Fields**: Tests computed properties like `isToday`

### Appointment API Tests (`routes/appointments.test.js`)
- **Successful Creation**: Tests valid appointment creation
- **Authentication**: Tests admin-only access
- **Authorization**: Tests role-based permissions
- **Validation**: Tests input validation and error handling
- **Error Scenarios**: Tests various error conditions
- **Data Population**: Tests student/teacher data population

## 🚀 Running Tests

### Prerequisites
1. **MongoDB Running**: Ensure MongoDB is running on localhost:27017
2. **Dependencies Installed**: Run `npm install` in the server directory

### Quick Start

#### Option 1: Using npm scripts
```bash
# Run all tests
npm test

# Run only appointment tests
npm run test:appointments

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Option 2: Using test runners
```bash
# Unix/Linux/macOS
./tests/run-tests.sh

# Windows
tests/run-tests.bat
```

#### Option 3: Direct Jest commands
```bash
# Run specific test file
npx jest tests/models/appointment.test.js --config=tests/jest.config.js

# Run with verbose output
npx jest tests/routes/appointments.test.js --config=tests/jest.config.js --verbose
```

## 📊 Test Scenarios

### Duration Calculation Tests
- ✅ 1 hour appointment (10:00-11:00 = 60 minutes)
- ✅ 30 minute appointment (14:00-14:30 = 30 minutes)
- ✅ 2.5 hour appointment (09:00-11:30 = 150 minutes)
- ✅ Complex time calculation (09:15-11:45 = 150 minutes)
- ✅ Single digit hours (9:00-10:30 = 90 minutes)
- ❌ End time before start time (11:00-10:00)
- ❌ Same start and end time (10:00-10:00)
- ❌ Invalid time format (25:00, 11:70)

### API Endpoint Tests
- ✅ Valid appointment creation
- ✅ Automatic duration calculation
- ✅ Default location setting
- ✅ Custom location handling
- ✅ Student/teacher population
- ❌ Missing authentication
- ❌ Non-admin user access
- ❌ Invalid required fields
- ❌ Invalid ID formats
- ❌ Invalid time/date formats
- ❌ Non-existent student/teacher
- ❌ Invalid teacher role

### Model Validation Tests
- ✅ Required field validation
- ✅ Subject not empty
- ✅ Time format regex validation
- ✅ Status enum validation
- ✅ Location enum validation
- ✅ Notes length limit (500 chars)
- ✅ Duration min/max limits
- ✅ Default value setting

## 🔧 Configuration

### Test Database
- **Database**: `tutoring_test`
- **URI**: `mongodb://localhost:27017/tutoring_test`
- **Isolation**: Each test runs in isolation with clean database

### Jest Configuration
- **Environment**: Node.js
- **Timeout**: 30 seconds
- **Workers**: 1 (for database isolation)
- **Coverage**: Enabled for models, routes, middleware, utils

### Environment Variables
```bash
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27017/tutoring_test
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service
- macOS: `brew services start mongodb-community`
- Ubuntu: `sudo systemctl start mongod`
- Windows: `net start MongoDB`

#### Test Timeout
```
Timeout - Async callback was not invoked within the 30000ms timeout
```
**Solution**: Check if MongoDB is responding, increase timeout in jest.config.js

#### Database Cleanup Issues
```
MongoError: collection already exists
```
**Solution**: Tests should clean up after themselves, check for proper `afterEach` cleanup

### Debug Mode
Run tests with debug output:
```bash
DEBUG=* npm test
```

## 📈 Coverage Reports

After running tests with coverage, check the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD

## 🔄 Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Database setup/teardown is handled automatically
- Tests are isolated and can run in parallel
- Coverage reports are generated for quality gates

## 📝 Adding New Tests

When adding new appointment-related tests:

1. **Model Tests**: Add to `models/appointment.test.js`
2. **API Tests**: Add to `routes/appointments.test.js`
3. **Follow Patterns**: Use existing test structure and naming conventions
4. **Clean Up**: Ensure proper database cleanup in `afterEach`
5. **Documentation**: Update this README with new test scenarios

## 🎯 Test Goals

- **100% Code Coverage**: All appointment creation code paths
- **Edge Case Coverage**: All validation scenarios and error conditions
- **Integration Testing**: Full API request/response cycle
- **Performance**: Tests complete within reasonable time limits
- **Reliability**: Tests are deterministic and don't flake
