import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Calendar, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    student: '',
    teacher: '',
    subject: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAppointments();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [currentPage, searchTerm, statusFilter, dateFilter, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user?.role === 'teacher') {
        // Teachers can only view their assigned appointments
        response = await api.get('/appointments/teacher');
        setAppointments(response.data.appointments || []);
        setTotalPages(1);
      } else if (user?.role === 'parent') {
        // Parents can only view available appointments for booking
        response = await api.get('/appointments/available');
        setAppointments(response.data.appointments || []);
        setTotalPages(1);
      } else if (user?.role === 'admin') {
        // Admins can view all appointments with full management
        const params = {
          page: currentPage,
          limit: 10,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter && { status: statusFilter }),
          ...(dateFilter && { startDate: dateFilter })
        };
        response = await api.get('/appointments', { params });
        setAppointments(response.data.appointments);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData({
      student: appointment.student?._id || '',
      teacher: appointment.teacher?._id || '',
      subject: appointment.subject || '',
      scheduledDate: appointment.scheduledDate ? moment(appointment.scheduledDate).format('YYYY-MM-DD') : '',
      startTime: appointment.startTime || '',
      endTime: appointment.endTime || '',
      notes: appointment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', createFormData);
      toast.success('Appointment created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        student: '',
        teacher: '',
        subject: '',
        scheduledDate: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/appointments/${selectedAppointment._id}`, editFormData);
      toast.success('Appointment updated successfully');
      setShowEditModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const [bookingInProgress, setBookingInProgress] = useState(false);

  const handleBookAppointment = async (appointmentId) => {
    if (bookingInProgress) return;

    if (!window.confirm('Are you sure you want to book this appointment?')) {
      return;
    }

    try {
      setBookingInProgress(true);
      // For now, we'll use the first student of the parent
      // In a real app, you'd have a student selection modal
      const response = await api.get('/students');
      const students = response.data.students;
      
      if (students.length === 0) {
        toast.error('No students found. Please add a student first.');
        return;
      }

      await api.post('/appointments/book', {
        appointmentId: appointmentId,
        student: students[0]._id,
        notes: 'Booked by parent'
      });
      
      toast.success('Appointment booked successfully!');
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'create') {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'edit') {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { class: 'status-available', text: 'Available' },
      booked: { class: 'status-booked', text: 'Booked' },
      scheduled: { class: 'status-scheduled', text: 'Scheduled' },
      confirmed: { class: 'status-confirmed', text: 'Confirmed' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' },
      rescheduled: { class: 'status-rescheduled', text: 'Rescheduled' }
    };

    const config = statusConfig[status] || statusConfig.available;
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

  const getRoleSpecificUsers = (role) => {
    return users.filter(u => u.role === role && u.isActive);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' && 'Appointments Management'}
            {user?.role === 'teacher' && 'My Assigned Appointments'}
            {user?.role === 'parent' && 'Available Appointments'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' && 'Manage tutoring sessions and schedules'}
            {user?.role === 'teacher' && 'View your assigned tutoring sessions'}
            {user?.role === 'parent' && 'Book available tutoring sessions for your children'}
          </p>
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
              {user?.role === 'admin' && (
                <>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </>
              )}
              {user?.role === 'teacher' && (
                <>
                  <option value="booked">Booked</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
              {user?.role === 'parent' && (
                <>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                </>
              )}
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
                {searchTerm || statusFilter || dateFilter ? 'Try adjusting your search criteria.' : 'Get started by creating a new appointment.'}
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
                    {user?.role === 'teacher' && <th className="table-header-cell">Student</th>}
                    {user?.role === 'parent' && <th className="table-header-cell">Teacher</th>}
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
                      {user?.role === 'teacher' && (
                        <td className="table-cell">
                          <span className="text-sm text-gray-900">
                            {appointment.student?.firstName} {appointment.student?.lastName}
                          </span>
                        </td>
                      )}
                      {user?.role === 'parent' && (
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
                            onClick={() => handleViewAppointment(appointment)}
                            className="btn btn-sm btn-secondary"
                            title="View Appointment"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Admin and Teacher actions */}
                          {canManageAppointment(appointment) && (
                            <>
                              <button
                                onClick={() => handleEditAppointment(appointment)}
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
                          
                          {/* Parent actions - booking only */}
                          {user?.role === 'parent' && appointment.status === 'available' && (
                            <button
                              onClick={() => handleBookAppointment(appointment._id)}
                              className="btn btn-sm btn-success"
                              title="Book Appointment"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Teacher actions - view only (no management) */}
                          {user?.role === 'teacher' && (
                            <span className="text-sm text-gray-500">
                              View Only
                            </span>
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

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Create New Appointment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    name="student"
                    value={createFormData.student}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Student</option>
                    {getRoleSpecificUsers('parent').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <select
                    name="teacher"
                    value={createFormData.teacher}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {getRoleSpecificUsers('teacher').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={createFormData.subject}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={createFormData.scheduledDate}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={createFormData.startTime}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={createFormData.endTime}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={createFormData.notes}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    rows="3"
                  />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAppointment}
                className="btn btn-primary"
              >
                Create Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Appointment Modal */}
      {showViewModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.startTime)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="text-sm text-gray-900">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm text-gray-900">{selectedAppointment.subject}</p>
                </div>
                {user?.role === 'admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student</label>
                      <p className="text-sm text-gray-900">
                        {selectedAppointment.student?.firstName} {selectedAppointment.student?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teacher</label>
                      <p className="text-sm text-gray-900">
                        {selectedAppointment.teacher?.firstName} {selectedAppointment.teacher?.lastName}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{getStatusBadge(selectedAppointment.status)}</p>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Edit Appointment</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAppointment} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    name="student"
                    value={editFormData.student}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Student</option>
                    {getRoleSpecificUsers('parent').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <select
                    name="teacher"
                    value={editFormData.teacher}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {getRoleSpecificUsers('teacher').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={editFormData.subject}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={editFormData.scheduledDate}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={editFormData.startTime}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={editFormData.endTime}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    rows="3"
                  />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAppointment}
                className="btn btn-primary"
              >
                Update Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;