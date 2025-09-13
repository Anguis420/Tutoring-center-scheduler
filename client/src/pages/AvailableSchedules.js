import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Search, 
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  X,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment-timezone';

const AvailableSchedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [bookingFormData, setBookingFormData] = useState({
    student: '',
    subject: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        isAvailable: true,
        ...(searchTerm && { search: searchTerm }),
        ...(dayFilter && { dayOfWeek: dayFilter }),
        ...(subjectFilter && { subject: subjectFilter }),
        ...(teacherFilter && { teacher: teacherFilter })
      };

      const response = await api.get('/schedules', { params });
      setSchedules(response.data.schedules);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch available schedules');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, dayFilter, subjectFilter, teacherFilter]);

  useEffect(() => {
    fetchSchedules();
    fetchStudents();
    fetchTeachers();
  }, [fetchSchedules]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await api.get('/users/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchStudents();
    fetchTeachers();
  }, [fetchSchedules, fetchStudents, fetchTeachers]);

  const generateAvailableDates = (schedule) => {
    const dates = [];
    // Consider using moment-timezone or ensuring consistent timezone handling
    // const timezone = 'America/New_York'; // or get from user preferences
    // Use timezone-aware moment operations
    const timezone = schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    const today = moment.tz(timezone);
    const endDate = moment.tz(timezone).add(4, 'weeks'); // Show next 4 weeks
    
    let currentDate = today.clone();
    
    while (currentDate.isBefore(endDate)) {
      // Compare weekday in the same timezone as the schedule
      if (currentDate.format('dddd').toLowerCase() === schedule.dayOfWeek) {        dates.push({
          date: currentDate.format('YYYY-MM-DD'),
          display: currentDate.format('MMM Do, YYYY'),
          dayName: currentDate.format('dddd')
        });      }
      currentDate.add(1, 'day');
    }
    
    return dates;
  };

  const [bookingLoading, setBookingLoading] = useState(false);

  const handleBookAppointment = (schedule) => {
    setSelectedSchedule(schedule);
    setBookingFormData({
      student: '',
      subject: schedule.subjects?.[0] || '',
      scheduledDate: '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      notes: ''
    });
    setAvailableDates(generateAvailableDates(schedule));
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingFormData.student || !bookingFormData.scheduledDate) {
      toast.error('Please select a student and date');
      return;
    }

    // Prevent duplicate submissions
    if (bookingLoading) return;

    try {
      setBookingLoading(true);
      const appointmentData = {
        student: bookingFormData.student,
        teacher: selectedSchedule.teacher._id,
        subject: bookingFormData.subject,
        scheduledDate: bookingFormData.scheduledDate,
        startTime: bookingFormData.startTime,
        endTime: bookingFormData.endTime,
        notes: bookingFormData.notes,
        location: 'in-person'
      };

      await api.post('/appointments/book-from-schedule', appointmentData);
      toast.success('Appointment booked successfully!');
      setShowBookingModal(false);
      setSelectedSchedule(null);
      fetchSchedules(); // Refresh schedules to update availability
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const getDayBadge = (day) => {
    const dayConfig = {
      monday: { class: 'badge-primary', text: 'Monday' },
      tuesday: { class: 'badge-primary', text: 'Tuesday' },
      wednesday: { class: 'badge-primary', text: 'Wednesday' },
      thursday: { class: 'badge-primary', text: 'Thursday' },
      friday: { class: 'badge-primary', text: 'Friday' },
      saturday: { class: 'badge-warning', text: 'Saturday' },
      sunday: { class: 'badge-warning', text: 'Sunday' }
    };

    const config = dayConfig[day] || dayConfig.monday;
    return <span className={config.class}>{config.text}</span>;
  };

  const getAvailabilityStatus = (schedule) => {
    if (schedule.currentBookings >= schedule.maxStudents) {
      return <span className="badge badge-danger">Fully Booked</span>;
    } else if (schedule.currentBookings >= schedule.maxStudents * 0.8) {
      return <span className="badge badge-warning">Almost Full</span>;
    } else {
      return <span className="badge badge-success">Available</span>;
    }
  };

  if (user?.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page is only available for parents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Schedules</h1>
          <p className="text-gray-600">Book appointments with teachers for your children</p>
        </div>
        <button
          onClick={fetchSchedules}
          className="btn btn-secondary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Day Filter */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="input"
            >
              <option value="">All Days</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>

            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input"
            >
              <option value="">All Subjects</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>

            {/* Teacher Filter */}
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="input"
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setDayFilter('');
                setSubjectFilter('');
                setTeacherFilter('');
              }}
              className="btn btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No available schedules</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dayFilter || subjectFilter || teacherFilter 
                ? 'Try adjusting your search criteria.' 
                : 'No teachers have available schedules at the moment.'}
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule._id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {schedule.teacher?.firstName} {schedule.teacher?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {schedule.teacher?.email}
                      </p>
                      {schedule.subjects?.length > 0
                        ? schedule.subjects.map((subject, index) => (
                            <span key={index} className="badge badge-secondary text-xs">
                              {subject}
                            </span>
                          ))
                        : <span className="text-sm text-gray-500">No subjects specified</span>}
                    </div>
                  </div>
                  {getAvailabilityStatus(schedule)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Day</span>
                    {getDayBadge(schedule.dayOfWeek)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Time</span>
                    <span className="text-sm text-gray-900">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Duration</span>
                    <span className="text-sm text-gray-900">
                      {schedule.duration} minutes
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Capacity</span>
                    <span className="text-sm text-gray-900">
                      {schedule.currentBookings}/{schedule.maxStudents} students
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-500">Subjects</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {schedule.subjects?.map((subject, index) => (
                        <span key={index} className="badge badge-secondary text-xs">
                          {subject}
                        </span>
                      )) || 'No subjects specified'}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleBookAppointment(schedule)}
                    disabled={schedule.currentBookings >= schedule.maxStudents}
                    className={`w-full btn ${
                      schedule.currentBookings >= schedule.maxStudents
                        ? 'btn-disabled'
                        : 'btn-primary'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {schedule.currentBookings >= schedule.maxStudents
                      ? 'Fully Booked'
                      : 'Book Appointment'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Book Appointment</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedSchedule.teacher?.firstName} {selectedSchedule.teacher?.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student *
                  </label>
                  <select
                    value={bookingFormData.student}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, student: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.firstName} {student.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={bookingFormData.subject}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    {!selectedSchedule.subjects?.length && (
                      <option value="">No subjects available</option>
                    )}
                    {selectedSchedule.subjects?.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <select
                    value={bookingFormData.scheduledDate}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Date</option>
                    {availableDates.map(date => (
                      <option key={date.date} value={date.date}>
                        {date.display} ({date.dayName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={bookingFormData.startTime}
                      className="input w-full"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={bookingFormData.endTime}
                      className="input w-full"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bookingFormData.notes}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input w-full"
                    rows={3}
                    placeholder="Any special notes or requirements..."
                  />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                className="btn btn-primary"
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <>
                    <div className="loading-spinner h-4 w-4 mr-2" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableSchedules;
