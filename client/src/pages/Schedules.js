import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  User
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

  useEffect(() => {
    fetchSchedules();
  }, [currentPage, searchTerm, dayFilter, teacherFilter]);

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

  if (!['admin', 'teacher'].includes(user?.role)) {
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
          <p className="text-gray-600">Manage teacher availability and time slots</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </button>
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
              {/* TODO: Populate with actual teachers */}
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
                            onClick={() => {/* TODO: Implement view schedule */}}
                            className="btn btn-sm btn-secondary"
                            title="View Schedule"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageSchedule(schedule) && (
                            <>
                              <button
                                onClick={() => {/* TODO: Implement edit schedule */}}
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

      {/* Create Schedule Modal - Placeholder */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Create New Schedule</h3>
            </div>
            <div className="modal-body">
              <p className="text-gray-600">
                Schedule creation functionality will be implemented here.
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

export default Schedules; 