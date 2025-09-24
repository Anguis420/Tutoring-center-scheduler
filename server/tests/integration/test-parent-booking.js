const axios = require('axios');

async function testParentBooking() {
  try {
    console.log('Testing parent booking functionality...');
    
    // First, login as a parent
    console.log('\n1. Logging in as parent...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: process.env.TEST_PARENT_EMAIL || 'parent@tutoring.com',
      password: process.env.TEST_PARENT_PASSWORD || 'parent123'
    });    
    const token = loginResponse.data.token;
    const parentId = loginResponse.data.user._id;
    
    console.log('Parent login successful!');
    console.log('Parent ID:', parentId);
    
    // Set up axios with auth header
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Get available schedules
    console.log('\n2. Fetching available schedules...');
    const schedulesResponse = await api.get('/schedules', {
      params: { isAvailable: true }
    });
    
    console.log('Available schedules found:', schedulesResponse.data.schedules.length);
    
    if (schedulesResponse.data.schedules.length === 0) {
      console.log('No available schedules found. Creating a test schedule...');
      
      // Create a test schedule (this would normally be done by admin)
      console.log('Note: This test requires an admin to create schedules first.');
      return;
    }
    
    // Get students for the parent
    console.log('\n3. Fetching students...');
    const studentsResponse = await api.get('/students');
    console.log('Students found:', studentsResponse.data.students.length);
    
    if (studentsResponse.data.students.length === 0) {
      console.log('No students found for parent. This test requires students to be added first.');
      return;
    }
    
    // Test booking an appointment
    console.log('\n4. Testing appointment booking...');
    const schedule = schedulesResponse.data.schedules[0];
    const student = studentsResponse.data.students[0];
    
    // Generate a future date for the same day of week
    const today = new Date();
    const scheduleDay = schedule.dayOfWeek;
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(scheduleDay);
    
    let targetDate = new Date(today);
    while (targetDate.getDay() !== targetDayIndex) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    const bookingData = {
      student: student._id,
      teacher: schedule.teacher._id,
      subject: schedule.subjects[0] || 'Math',
      scheduledDate: targetDate.toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      notes: 'Test booking from parent interface'
    };
    
    console.log('Booking data:', bookingData);
    
    const bookingResponse = await api.post('/appointments/book-from-schedule', bookingData);
    console.log('Booking successful!');
    const appointmentId = bookingResponse.data?.appointment?._id;
    if (!appointmentId) {
      throw new Error('Invalid booking response: missing appointment ID');
    }
    console.log('Appointment ID:', appointmentId);    
    // Verify the schedule booking count was updated
    console.log('\n5. Verifying schedule was updated...');
    const updatedScheduleResponse = await api.get(`/schedules/${schedule._id}`);
    const updatedSchedule = updatedScheduleResponse.data?.schedule;
    if (!updatedSchedule) {
      throw new Error('Invalid schedule response: missing schedule data');
    }    
    console.log('Original bookings:', schedule.currentBookings);
    console.log('Updated bookings:', updatedSchedule.currentBookings);
    console.log('Max students:', updatedSchedule.maxStudents);
    
    if (updatedSchedule.currentBookings > schedule.currentBookings) {
      console.log('✅ Schedule booking count was updated successfully!');
    } else {
      console.log('❌ Schedule booking count was not updated');
    }
    
    console.log('\n✅ Parent booking test completed successfully!');
    
  } catch (error) {
    console.error('❌ Parent booking test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testParentBooking();
