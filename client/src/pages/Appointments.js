import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFilter && { startDate: dateFilter })
      };

      const response = await api.get('/appointments', { params });
      setAppointments(response.data.appointments);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await api.delete(`/appointments/${appointmentId}`);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'status-scheduled', text: 'Scheduled' },
      confirmed: { class: 'status-confirmed', text: 'Confirmed' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' },
      rescheduled: { class: 'status-rescheduled', text: 'Rescheduled' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <span className={config.class}>{config.text}</span>;
  };

  const formatDateTime = (date, time) => {
    return moment(date).format('MMM Do, YYYY') + ' at ' + time;
  };

  const canManageAppointment = (appointment) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'teacher' && appointment.teacher === user._id) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage tutoring sessions and schedules</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input"
            />

            {/* Refresh Button */}
            <button
              onClick={fetchAppointments}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || dateFilter ? 'Try adjusting your search criteria.' : 'Get started by creating an appointment.'}
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
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateTime(appointment.scheduledDate, appointment.startTime)}
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
                          <span className="text-sm text-gray-900">
                            {appointment.student?.firstName} {appointment.student?.lastName}
                          </span>
                        </td>
                      )}
                      {user?.role === 'admin' && (
                        <td className="table-cell">
                          <span className="text-sm text-gray-900">
                            {appointment.teacher?.firstName} {appointment.teacher?.lastName}
                          </span>
                        </td>
                      )}
                      <td className="table-cell">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {/* TODO: Implement view appointment */}}
                            className="btn btn-sm btn-secondary"
                            title="View Appointment"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageAppointment(appointment) && (
                            <>
                              <button
                                onClick={() => {/* TODO: Implement edit appointment */}}
                                className="btn btn-sm btn-primary"
                                title="Edit Appointment"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {!['cancelled', 'completed'].includes(appointment.status) && (
                                <button
                                  onClick={() => handleDeleteAppointment(appointment._id)}
                                  className="btn btn-sm btn-danger"
                                  title="Cancel Appointment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

      {/* Create Appointment Modal - Placeholder */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Create New Appointment</h3>
            </div>
            <div className="modal-body">
              <p className="text-gray-600">
                Appointment creation functionality will be implemented here.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments; 