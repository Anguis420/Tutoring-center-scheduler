import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments for the user
      const appointmentsResponse = await api.get('/appointments', {
        params: { limit: 10 }
      });
      
      const appointments = appointmentsResponse.data.appointments;
      
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

      setRecentAppointments(appointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
                  <button className="btn btn-primary w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </button>
                  <button className="btn btn-secondary w-full">
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
                  <button className="btn btn-primary w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    View Schedule
                  </button>
                  <button className="btn btn-secondary w-full">
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
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Children's Progress</h3>
              </div>
              <div className="card-body">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {user?.children?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Active Students</div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button className="btn btn-primary w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </button>
                  <button className="btn btn-secondary w-full">
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
              Here's what's happening with your {user?.role === 'admin' ? 'tutoring center' : 'schedule'} today.
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
          <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
        </div>
        <div className="card-body">
          {recentAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'admin' 
                  ? 'Create some appointments to get started.' 
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