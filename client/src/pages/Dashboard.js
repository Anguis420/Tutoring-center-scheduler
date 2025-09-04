import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle,
  XCircle,
  ChevronDown,
  User,
  Plus
} from 'lucide-react';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (user?.role === 'parent') {
      fetchStudents();
    }
  }, [user, selectedStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments for the user or selected student
      let appointmentsResponse;
      if (user?.role === 'parent' && selectedStudent) {
        // Get appointments for specific student
        appointmentsResponse = await api.get(`/students/${selectedStudent._id}/appointments`);
        const appointments = appointmentsResponse.data.appointments;
        setRecentAppointments(appointments.slice(0, 5));
      } else {
        // Get appointments for the user
        appointmentsResponse = await api.get('/appointments', {
          params: { limit: 10 }
        });
        const appointments = appointmentsResponse.data.appointments;
        setRecentAppointments(appointments.slice(0, 5));
      }
      
      const appointments = recentAppointments;
      
      // Calculate statistics
      const now = new Date();
      const total = appointments.length;
      const upcoming = appointments.filter(apt => 
        new Date(apt.scheduledDate) > now && 
        !['cancelled', 'completed'].includes(apt.status)
      ).length;
      const completed = appointments.filter(apt => 
        apt.status === 'completed'
      ).length;
      const cancelled = appointments.filter(apt => 
        apt.status === 'cancelled'
      ).length;

      setStats({
        totalAppointments: total,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      const fetchedStudents = response.data.students;
      setStudents(fetchedStudents);
      
      // Auto-select first student if available
      if (fetchedStudents.length > 0 && !selectedStudent) {
        setSelectedStudent(fetchedStudents[0]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Quick Action Handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'manageUsers':
        navigate('/users');
        break;
      case 'createAppointment':
        navigate('/appointments');
        break;
      case 'viewSchedule':
        navigate('/schedules');
        break;
      case 'updateNotes':
        navigate('/appointments');
        break;
      case 'requestReschedule':
        navigate('/appointments');
        break;
      case 'manageStudents':
        navigate('/students');
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'status-scheduled', text: 'Scheduled' },
      confirmed: { class: 'status-confirmed', text: 'Confirmed' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' },
      rescheduled: { class: 'status-rescheduled', text: 'Rescheduled' },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <span className={config.class}>{config.text}</span>;
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats.totalAppointments}
                    </div>
                    <div className="text-sm text-gray-500">Total Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {stats.upcomingAppointments}
                    </div>
                    <div className="text-sm text-gray-500">Upcoming</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => handleQuickAction('manageUsers')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </button>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => handleQuickAction('createAppointment')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'teacher':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
              </div>
              <div className="card-body">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {recentAppointments.filter(apt => 
                      moment(apt.scheduledDate).isSame(moment(), 'day')
                    ).length}
                  </div>
                  <div className="text-sm text-gray-500">Appointments Today</div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => handleQuickAction('viewSchedule')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Schedule
                  </button>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => handleQuickAction('updateNotes')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Update Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'parent':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Student Selector */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Current Student</h3>
              </div>
              <div className="card-body">
                {students.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No students added yet</p>
                    <p className="text-xs text-gray-400">Contact an administrator to add students to your account</p>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowStudentSelector(!showStudentSelector)}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Select Student'}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showStudentSelector ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showStudentSelector && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {students.map((student) => (
                          <button
                            key={student._id}
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowStudentSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                              selectedStudent?._id === student._id ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-gray-500 ml-6">
                              Grade {student.grade} • Age {student.currentAge}
                            </div>
                          </button>
                        ))}
                        <div className="border-t border-gray-200">
                          <button
                            onClick={() => {
                              setShowStudentSelector(false);
                              handleQuickAction('manageStudents');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-primary-600 hover:bg-primary-50"
                          >
                            <Plus className="h-4 w-4 mr-2 inline" />
                            Manage Students
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => navigate('/available-schedules')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointments
                  </button>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => handleQuickAction('viewSchedule')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Schedules
                  </button>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => handleQuickAction('requestReschedule')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Request Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600">
              {user?.role === 'parent' && selectedStudent 
                ? `Here's what's happening with ${selectedStudent.firstName}'s schedule today.`
                : `Here's what's happening with your ${user?.role === 'admin' ? 'tutoring center' : 'schedule'} today.`
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-900">
              {moment().format('dddd, MMMM Do')}
            </p>
          </div>
        </div>
      </div>

      {/* Role-specific Content */}
      {getRoleSpecificContent()}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalAppointments}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.upcomingAppointments}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completedAppointments}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.cancelledAppointments}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            {user?.role === 'parent' && selectedStudent 
              ? `${selectedStudent.firstName}'s Recent Appointments`
              : 'Recent Appointments'
            }
          </h3>
        </div>
        <div className="card-body">
          {recentAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'admin' 
                  ? 'Create some appointments to get started.' 
                  : user?.role === 'parent' && selectedStudent
                  ? `${selectedStudent.firstName} doesn't have any appointments yet.`
                  : 'You don\'t have any appointments yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Date & Time</th>
                    <th className="table-header-cell">Subject</th>
                    {user?.role === 'admin' && <th className="table-header-cell">Student</th>}
                    {user?.role === 'admin' && <th className="table-header-cell">Teacher</th>}
                    <th className="table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {moment(appointment.scheduledDate).format('MMM Do, YYYY')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.startTime} - {appointment.endTime}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-primary">{appointment.subject}</span>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="table-cell">
                          {appointment.student?.firstName} {appointment.student?.lastName}
                        </td>
                      )}
                      {user?.role === 'admin' && (
                        <td className="table-cell">
                          {appointment.teacher?.firstName} {appointment.teacher?.lastName}
                        </td>
                      )}
                      <td className="table-cell">
                        {getStatusBadge(appointment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 