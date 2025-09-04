import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Clock, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  User,
  X,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const Schedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    teacher: '',
    dayOfWeek: 'monday',
    startTime: '',
    endTime: '',
    duration: 60,
    subjects: [],
    maxStudents: 5,
    isAvailable: true
  });
  const [editFormData, setEditFormData] = useState({});
  const [users, setUsers] = useState([]);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    fetchSchedules();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [currentPage, searchTerm, dayFilter, teacherFilter, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(dayFilter && { dayOfWeek: dayFilter }),
        ...(teacherFilter && { teacher: teacherFilter })
      };

      const response = await api.get('/schedules', { params });
      setSchedules(response.data.schedules);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
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

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success('Schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setShowViewModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setEditFormData({
      teacher: schedule.teacher?._id || '',
      dayOfWeek: schedule.dayOfWeek || 'monday',
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      duration: schedule.duration || 60,
      subjects: schedule.subjects || [],
      maxStudents: schedule.maxStudents || 5,
      isAvailable: schedule.isAvailable !== undefined ? schedule.isAvailable : true
    });
    setShowEditModal(true);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!createFormData.teacher || !createFormData.startTime || !createFormData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await api.post('/schedules', createFormData);
      toast.success('Schedule created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        teacher: '',
        dayOfWeek: 'monday',
        startTime: '',
        endTime: '',
        duration: 60,
        subjects: [],
        maxStudents: 5,
        isAvailable: true
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create schedule');
      }
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/schedules/${selectedSchedule._id}`, editFormData);
      toast.success('Schedule updated successfully');
      setShowEditModal(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (formType === 'create') {
      setCreateFormData(prev => ({ ...prev, [name]: val }));
    } else if (formType === 'edit') {
      setEditFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const addSubject = (formType) => {
    if (!newSubject.trim()) return;
    
    if (formType === 'create') {
      setCreateFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
    } else if (formType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
    }
    setNewSubject('');
  };

  const removeSubject = (index, formType) => {
    if (formType === 'create') {
      setCreateFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== index)
      }));
    } else if (formType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== index)
      }));
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

  const getAvailabilityBadge = (isAvailable) => {
    return isAvailable ? (
      <span className="badge badge-success">Available</span>
    ) : (
      <span className="badge badge-danger">Unavailable</span>
    );
  };

  const formatTime = (time) => {
    return time || 'N/A';
  };

  const canManageSchedule = (schedule) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'teacher' && schedule.teacher === user._id) return true;
    return false;
  };

  const getRoleSpecificUsers = (role) => {
    return users.filter(u => u.role === role && u.isActive);
  };

  if (!['admin', 'teacher', 'parent'].includes(user?.role)) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600">
            {user?.role === 'parent' 
              ? 'View available teacher schedules and book appointments' 
              : 'Manage teacher availability and schedules'
            }
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </button>
        )}
        {user?.role === 'parent' && (
          <a
            href="/available-schedules"
            className="btn btn-primary"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Book Appointments
          </a>
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
                placeholder="Search schedules..."
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

            {/* Teacher Filter */}
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="input"
            >
              <option value="">All Teachers</option>
              {getRoleSpecificUsers('teacher').map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchSchedules}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Schedules</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || dayFilter || teacherFilter ? 'Try adjusting your search criteria.' : 'Get started by creating a schedule.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Teacher</th>
                    <th className="table-header-cell">Day</th>
                    <th className="table-header-cell">Time</th>
                    <th className="table-header-cell">Subjects</th>
                    <th className="table-header-cell">Capacity</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.teacher?.firstName} {schedule.teacher?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.teacher?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getDayBadge(schedule.dayOfWeek)}
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.duration} minutes
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {schedule.subjects?.map((subject, index) => (
                            <span key={index} className="badge badge-secondary text-xs">
                              {subject}
                            </span>
                          )) || 'No subjects'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.currentBookings}/{schedule.maxStudents}
                          </div>
                          <div className="text-xs text-gray-500">
                            {schedule.availableCapacity} available
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getAvailabilityBadge(schedule.isAvailable)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewSchedule(schedule)}
                            className="btn btn-sm btn-secondary"
                            title="View Schedule"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user?.role === 'parent' ? (
                            <a
                              href="/available-schedules"
                              className="btn btn-sm btn-primary"
                              title="Book Appointment"
                            >
                              <BookOpen className="h-4 w-4" />
                            </a>
                          ) : canManageSchedule(schedule) && (
                            <>
                              <button
                                onClick={() => handleEditSchedule(schedule)}
                                className="btn btn-sm btn-primary"
                                title="Edit Schedule"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule._id)}
                                className="btn btn-sm btn-danger"
                                title="Delete Schedule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Create New Schedule</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {getRoleSpecificUsers('teacher').map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    name="dayOfWeek"
                    value={createFormData.dayOfWeek}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={createFormData.duration}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    min="15"
                    step="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={createFormData.maxStudents}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    min="1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Add subject"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => addSubject('create')}
                      className="btn btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {createFormData.subjects.map((subject, index) => (
                      <span key={index} className="badge badge-secondary">
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(index, 'create')}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={createFormData.isAvailable}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>
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
                onClick={handleCreateSchedule}
                className="btn btn-primary"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Schedule Modal */}
      {showViewModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Schedule Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <p className="text-sm text-gray-900">
                    {selectedSchedule.teacher?.firstName} {selectedSchedule.teacher?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Day</label>
                  <p className="text-sm text-gray-900">{getDayBadge(selectedSchedule.dayOfWeek)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="text-sm text-gray-900">
                    {selectedSchedule.startTime} - {selectedSchedule.endTime} ({selectedSchedule.duration} minutes)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedSchedule.subjects?.map((subject, index) => (
                      <span key={index} className="badge badge-secondary text-xs">
                        {subject}
                      </span>
                    )) || 'No subjects'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <p className="text-sm text-gray-900">
                    {selectedSchedule.currentBookings}/{selectedSchedule.maxStudents} students
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{getAvailabilityBadge(selectedSchedule.isAvailable)}</p>
                </div>
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

      {/* Edit Schedule Modal */}
      {showEditModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Edit Schedule</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSchedule} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {getRoleSpecificUsers('teacher').map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    name="dayOfWeek"
                    value={editFormData.dayOfWeek}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={editFormData.duration}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    min="15"
                    step="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={editFormData.maxStudents}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    min="1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Add subject"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => addSubject('edit')}
                      className="btn btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {editFormData.subjects?.map((subject, index) => (
                      <span key={index} className="badge badge-secondary">
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(index, 'edit')}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={editFormData.isAvailable}
                      onChange={(e) => handleInputChange(e, 'edit')}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>
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
                onClick={handleUpdateSchedule}
                className="btn btn-primary"
              >
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules; 