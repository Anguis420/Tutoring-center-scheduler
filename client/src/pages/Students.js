import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  UserPlus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    grade: '',
    parent: '',
    subjects: [],
    notes: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      learningStyle: 'mixed',
      preferredTimes: []
    }
  });
  const [editFormData, setEditFormData] = useState({});
  const [newSubject, setNewSubject] = useState('');
  const [parents, setParents] = useState([]);

  useEffect(() => {
    fetchStudents();
    if (user?.role === 'admin') {
      fetchParents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await api.get('/users');
      const parentUsers = response.data.users.filter(u => u.role === 'parent' && u.isActive);
      setParents(parentUsers);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', createFormData);
      toast.success('Student added successfully');
      setShowCreateModal(false);
      setCreateFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: '',
        grade: '',
        parent: '',
        subjects: [],
        notes: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        preferences: {
          learningStyle: 'mixed',
          preferredTimes: []
        }
      });
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${selectedStudent._id}`, editFormData);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student?')) {
      return;
    }

    try {
      await api.delete(`/students/${studentId}`);
      toast.success('Student removed successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditStudentModal = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      dateOfBirth: student.dateOfBirth ? moment(student.dateOfBirth).format('YYYY-MM-DD') : '',
      age: student.age || '',
      grade: student.grade || '',
      subjects: student.subjects || [],
      notes: student.notes || '',
      emergencyContact: student.emergencyContact || { name: '', phone: '', relationship: '' },
      preferences: student.preferences || { learningStyle: 'mixed', preferredTimes: [] }
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'create') {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setCreateFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value }
        }));
      } else {
        setCreateFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (formType === 'edit') {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setEditFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value }
        }));
      } else {
        setEditFormData(prev => ({ ...prev, [name]: value }));
      }
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



  const getLearningStyleLabel = (style) => {
    const styles = {
      visual: 'Visual',
      auditory: 'Auditory',
      kinesthetic: 'Kinesthetic',
      reading: 'Reading',
      mixed: 'Mixed'
    };
    return styles[style] || style;
  };

  if (!['admin', 'parent'].includes(user?.role)) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page is only available for admins and parents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Student Management' : 'My Students'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Manage all students in the system' 
              : 'View your children\'s information and schedules'
            }
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        )}
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner h-8 w-8"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {user?.role === 'admin' ? 'No students found' : 'No students assigned yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' 
              ? 'Get started by adding a new student.' 
              : 'Contact an administrator to add students to your account.'
            }
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Student
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student._id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Grade {student.grade} • Age {student.currentAge}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewStudent(student)}
                      className="btn btn-sm btn-secondary"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEditStudentModal(student)}
                          className="btn btn-sm btn-primary"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className="btn btn-sm btn-danger"
                          title="Remove Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                {student.subjects && student.subjects.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects</h4>
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map((subject, index) => (
                        <span key={index} className="badge badge-primary text-xs">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Style */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Learning Style</h4>
                  <span className="badge badge-secondary">
                    {getLearningStyleLabel(student.preferences?.learningStyle)}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleViewStudent(student)}
                    className="btn btn-sm btn-secondary flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    View Schedule
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleEditStudentModal(student)}
                      className="btn btn-sm btn-primary flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Edit Info
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Student Modal - Admin Only */}
      {showCreateModal && user?.role === 'admin' && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={createFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={createFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent
                  </label>
                  <select
                    name="parent"
                    value={createFormData.parent}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  >
                    <option value="">Select Parent</option>
                    {parents.map(parent => (
                      <option key={parent._id} value={parent._id}>
                        {parent.firstName} {parent.lastName} ({parent.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={createFormData.dateOfBirth}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={createFormData.age}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    min="3"
                    max="18"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={createFormData.grade}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    placeholder="e.g., 5th Grade"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Style
                  </label>
                  <select
                    name="preferences.learningStyle"
                    value={createFormData.preferences.learningStyle}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="reading">Reading</option>
                  </select>
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
                      <span key={index} className="badge badge-primary">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={createFormData.notes}
                    onChange={(e) => handleInputChange(e, 'create')}
                    className="input w-full"
                    rows="3"
                    placeholder="Any special notes about the student..."
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
                onClick={handleCreateStudent}
                className="btn btn-primary"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Student Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-medium text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h4>
                    <p className="text-gray-500">
                      Grade {selectedStudent.grade} • Age {selectedStudent.currentAge}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-sm text-gray-900">
                      {moment(selectedStudent.dateOfBirth).format('MMMM Do, YYYY')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Learning Style</label>
                    <p className="text-sm text-gray-900">
                      {getLearningStyleLabel(selectedStudent.preferences?.learningStyle)}
                    </p>
                  </div>
                  {selectedStudent.subjects && selectedStudent.subjects.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Subjects</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStudent.subjects.map((subject, index) => (
                          <span key={index} className="badge badge-primary">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedStudent.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-sm text-gray-900">{selectedStudent.notes}</p>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {selectedStudent.emergencyContact?.name && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">{selectedStudent.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{selectedStudent.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Relationship</label>
                        <p className="text-sm text-gray-900">{selectedStudent.emergencyContact.relationship}</p>
                      </div>
                    </div>
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
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditStudentModal(selectedStudent);
                  }}
                  className="btn btn-primary"
                >
                  Edit Student
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal - Admin Only */}
      {showEditModal && selectedStudent && user?.role === 'admin' && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Edit Student</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditStudent} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={editFormData.age}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    min="3"
                    max="18"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={editFormData.grade}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Style
                  </label>
                  <select
                    name="preferences.learningStyle"
                    value={editFormData.preferences?.learningStyle}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="reading">Reading</option>
                  </select>
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
                      <span key={index} className="badge badge-primary">
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
                onClick={handleEditStudent}
                className="btn btn-primary"
              >
                Update Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students; 