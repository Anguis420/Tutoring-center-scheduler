import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Eye,
  UserPlus,
  X,
  User,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'parent',
    password: ''
  });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddStudentSection, setShowAddStudentSection] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [students, setStudents] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    grade: '',
    subjects: [],
    notes: ''
  });
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      };

      const response = await api.get('/users', { params });
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Only show error toast for actual errors, not empty responses
      if (error.response?.status >= 400) {
        toast.error('Failed to fetch users');
      } else {
        // For network errors or other issues, still show error but don't treat as critical
        console.warn('Non-critical error fetching users:', error.message);
      }
      
      // Ensure we have empty state on any error
      setUsers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const handleViewUser = (userItem) => {
    setSelectedUser(userItem);
    setShowViewModal(true);
  };

  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    setEditFormData({
      firstName: userItem.firstName || '',
      lastName: userItem.lastName || '',
      email: userItem.email || '',
      phone: userItem.phone || '',
      role: userItem.role || 'parent'
    });
    setShowEditModal(true);
  };

  // Validation function
  const validateCreateForm = () => {
    const errors = {};
    
    // First Name validation
    if (!createFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (createFormData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (createFormData.firstName.trim().length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters';
    }
    
    // Last Name validation
    if (!createFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (createFormData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (createFormData.lastName.trim().length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters';
    }
    
    // Email validation
    if (!createFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (optional but if provided, must be valid)
    if (createFormData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(createFormData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Role validation
    if (!createFormData.role) {
      errors.role = 'Role is required';
    } else if (!['parent', 'teacher', 'admin'].includes(createFormData.role)) {
      errors.role = 'Please select a valid role';
    }
    
    // Password validation
    if (!createFormData.password) {
      errors.password = 'Password is required';
    } else if (createFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  // Helper function to reset create form
  const resetCreateForm = () => {
    setCreateFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'parent',
      password: ''
    });
    setStudents([]);
    setNewStudent({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: '',
      grade: '',
      subjects: [],
      notes: ''
    });
    setCreateFormErrors({});
    setIsSubmitting(false);
    setShowAddStudentSection(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateCreateForm();
    setCreateFormErrors(errors);
    
    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // First create the user
      const userResponse = await api.post('/users', createFormData);
      const createdUser = userResponse.data.user;
      
      // If this is a parent and we have students, create them
      if (createFormData.role === 'parent' && students.length > 0) {
        try {
          // Create each student
          for (const student of students) {
            await api.post('/students', {
              ...student,
              parent: createdUser._id
            });
          }
          toast.success(`User and ${students.length} student(s) created successfully`);
        } catch (studentError) {
          console.error('Error creating students:', studentError);
          toast.success('User created successfully, but failed to create students');
        }
      } else {
        toast.success('User created successfully');
      }

      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.data?.errors) {
        // Server-side validation errors
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.path] = err.msg;
        });
        setCreateFormErrors(serverErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser._id}`, editFormData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'create') {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
      // Clear error for this field when user starts typing
      if (createFormErrors[name]) {
        setCreateFormErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
      // Reset add student section when role changes
      if (name === 'role') {
        setShowAddStudentSection(false);
      }
    } else if (formType === 'edit') {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStudentInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const addStudent = () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.grade) {
      toast.error('Please fill in all required student fields');
      return;
    }

    setStudents(prev => [...prev, { ...newStudent }]);
    setNewStudent({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: '',
      grade: '',
      subjects: [],
      notes: ''
    });
    setNewSubject('');
    setShowAddStudentSection(false);
    toast.success('Student added successfully');
  };

  const removeStudent = (index) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleManageStudents = async (parentUser) => {
    setSelectedUser(parentUser);
    setShowManageStudentsModal(true);
    
    try {
      // Fetch existing students for this parent
      const response = await api.get('/students');
      const parentStudents = response.data.students.filter(
        student => student.parent === parentUser._id
      );
      setExistingStudents(parentStudents);
    } catch (error) {
      console.error('Error fetching existing students:', error);
      toast.error('Failed to fetch existing students');
    }
  };

  const handleAddStudentToParent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.grade) {
      toast.error('Please fill in all required student fields');
      return;
    }

    try {
      await api.post('/students', {
        ...newStudent,
        parent: selectedUser._id
      });
      
      toast.success('Student added successfully');
      
      // Reset form and refresh students list
      setNewStudent({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: '',
        grade: '',
        subjects: [],
        notes: ''
      });
      setNewSubject('');
      
      // Refresh existing students
      const response = await api.get('/students');
      const parentStudents = response.data.students.filter(
        student => student.parent === selectedUser._id
      );
      setExistingStudents(parentStudents);
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleRemoveStudentFromParent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student?')) {
      return;
    }

    try {
      await api.delete(`/students/${studentId}`);
      toast.success('Student removed successfully');
      
      // Refresh existing students
      const response = await api.get('/students');
      const parentStudents = response.data.students.filter(
        student => student.parent === selectedUser._id
      );
      setExistingStudents(parentStudents);
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const addSubjectToStudent = (studentIndex, isNewStudent = false) => {
    if (!newSubject.trim()) return;
    
    if (isNewStudent) {
      // Adding subject to new student in create form
      setStudents(prev => prev.map((student, index) => {
        if (index === studentIndex) {
          return {
            ...student,
            subjects: [...student.subjects, newSubject.trim()]
          };
        }
        return student;
      }));
    } else {
      // Adding subject to existing student in manage students modal
      setExistingStudents(prev => prev.map((student, index) => {
        if (index === studentIndex) {
          return {
            ...student,
            subjects: [...student.subjects, newSubject.trim()]
          };
        }
        return student;
      }));
    }
    setNewSubject('');
  };

  const removeSubjectFromStudent = (studentIndex, subjectIndex, isNewStudent = false) => {
    if (isNewStudent) {
      // Removing subject from new student in create form
      setStudents(prev => prev.map((student, index) => {
        if (index === studentIndex) {
          return {
            ...student,
            subjects: student.subjects.filter((_, i) => i !== subjectIndex)
          };
        }
        return student;
      }));
    } else {
      // Removing subject from existing student in manage students modal
      setExistingStudents(prev => prev.map((student, index) => {
        if (index === studentIndex) {
          return {
            ...student,
            subjects: student.subjects.filter((_, i) => i !== subjectIndex)
          };
        }
        return student;
      }));
    }
  };

  const addSubjectToNewStudent = () => {
    if (!newSubject.trim()) return;
    
    setNewStudent(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject.trim()]
    }));
    setNewSubject('');
  };

  const removeSubjectFromNewStudent = (subjectIndex) => {
    setNewStudent(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== subjectIndex)
    }));
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { class: 'badge-danger', text: 'Admin' },
      teacher: { class: 'badge-primary', text: 'Teacher' },
      parent: { class: 'badge-success', text: 'Parent' }
    };

    const config = roleConfig[role] || roleConfig.parent;
    return <span className={config.class}>{config.text}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-danger">Inactive</span>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                onKeyPress={(e) => e.key === 'Enter' && setCurrentPage(1)}
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setCurrentPage(1);
                }}
                className="btn btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter 
                  ? 'Try adjusting your search criteria or filters.' 
                  : 'Get started by creating your first user.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 btn btn-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create First User
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Role</th>
                    <th className="table-header-cell">Phone</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {users.map((userItem) => (
                    <tr key={userItem._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.firstName} {userItem.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{userItem.email}</div>
                      </td>
                      <td className="table-cell">
                        {getRoleBadge(userItem.role)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {userItem.phone || 'Not provided'}
                        </div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(userItem.isActive)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(userItem)}
                            className="btn btn-sm btn-secondary"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="btn btn-sm btn-primary"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {userItem.role === 'parent' && (
                            <button
                              onClick={() => handleManageStudents(userItem)}
                              className="btn btn-sm btn-success"
                              title="Manage Students"
                            >
                              <GraduationCap className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(userItem._id)}
                            className="btn btn-sm btn-danger"
                            title="Deactivate User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}>
          <div className="modal max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-body">
              {/* Form Instructions */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Required fields are marked with</span> <span className="text-red-500 font-bold">*</span>
                </p>
              </div>
              
              {/* User Information */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={createFormData.firstName}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      required
                    />
                    {createFormErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={createFormData.lastName}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      required
                    />
                    {createFormErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={createFormData.email}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      required
                    />
                    {createFormErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={createFormData.phone}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., +1234567890"
                    />
                    {createFormErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={createFormData.role}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      required
                    >
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    {createFormErrors.role && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.role}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={createFormData.password}
                      onChange={(e) => handleInputChange(e, 'create')}
                      className={`input w-full ${createFormErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      required
                      placeholder="Minimum 6 characters"
                    />
                    {createFormErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{createFormErrors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Information - Only show for parents */}
              {createFormData.role === 'parent' && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Student Information (Optional)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    You can add students now or add them later from the Students page.
                  </p>
                  
                  {/* Show Add Student Button or Form */}
                  {!showAddStudentSection ? (
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          Would you like to add a student for this parent?
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddStudentSection(true)}
                          className="btn btn-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Student
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Add New Student</h5>
                        <button
                          type="button"
                          onClick={() => setShowAddStudentSection(false)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={newStudent.firstName}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={newStudent.lastName}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={newStudent.dateOfBirth}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          name="currentAge"
                          value={newStudent.currentAge}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                          min="3"
                          max="18"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade
                        </label>
                        <input
                          type="text"
                          name="grade"
                          value={newStudent.grade}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                          placeholder="e.g., 5th Grade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Add subject"
                            className="input flex-1"
                          />
                          <button
                            type="button"
                            onClick={addSubjectToNewStudent}
                            className="btn btn-secondary btn-sm"
                          >
                            Add
                          </button>
                        </div>
                        {/* Display current subjects for this student */}
                        {newStudent.subjects.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {newStudent.subjects.map((subject, index) => (
                              <span key={index} className="badge badge-primary text-xs">
                                {subject}
                                <button
                                  type="button"
                                  onClick={() => removeSubjectFromNewStudent(index)}
                                  className="ml-1 text-xs hover:text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={newStudent.notes}
                          onChange={handleStudentInputChange}
                          className="input w-full"
                          rows="2"
                          placeholder="Any special notes about the student..."
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={addStudent}
                        className="btn btn-secondary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </button>
                    </div>
                  </div>
                  )}

                  {/* List of Added Students */}
                  {students.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Students to be Added ({students.length})
                      </h5>
                      <div className="space-y-3">
                        {students.map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Grade {student.grade} • Age {student.currentAge}
                                {student.subjects.length > 0 && (
                                  <span className="ml-2">
                                    • Subjects: {student.subjects.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStudent(index)}
                              className="btn btn-danger btn-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create User{students.length > 0 ? ` & ${students.length} Student(s)` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{getRoleBadge(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{getStatusBadge(selectedUser.isActive)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
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
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditUser(selectedUser);
                }}
                className="btn btn-primary"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="modal-body">
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    className="input w-full"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={(e) => handleInputChange(e, 'edit')}
                    className="input w-full"
                    required
                  >
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
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
                onClick={handleUpdateUser}
                className="btn btn-primary"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {showManageStudentsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowManageStudentsModal(false)}>
          <div className="modal max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">
                Manage Students for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <button
                onClick={() => setShowManageStudentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              {/* Existing Students */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Existing Students ({existingStudents.length})
                </h4>
                
                {existingStudents.length === 0 ? (
                  <div className="text-center py-6 border border-gray-200 rounded-lg">
                    <GraduationCap className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No students assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingStudents.map((student, index) => (
                      <div key={student._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade {student.grade} • Age {student.currentAge}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStudentFromParent(student._id)}
                            className="btn btn-danger btn-sm"
                            title="Remove Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Subjects */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Subjects</label>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {student.subjects.map((subject, subjectIndex) => (
                              <span key={subjectIndex} className="badge badge-primary text-xs">
                                {subject}
                                <button
                                  type="button"
                                  onClick={() => removeSubjectFromStudent(index, subjectIndex, false)}
                                  className="ml-1 text-xs hover:text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              placeholder="Add subject"
                              className="input flex-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => addSubjectToStudent(index, false)}
                              className="btn btn-secondary btn-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        
                        {/* Notes */}
                        {student.notes && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                            <p className="text-sm text-gray-600">{student.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Student */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Student
                </h4>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={newStudent.firstName}
                        onChange={handleStudentInputChange}
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
                        value={newStudent.lastName}
                        onChange={handleStudentInputChange}
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
                        value={newStudent.dateOfBirth}
                        onChange={handleStudentInputChange}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        name="currentAge"
                        value={newStudent.currentAge}
                        onChange={handleStudentInputChange}
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
                        value={newStudent.grade}
                        onChange={handleStudentInputChange}
                        className="input w-full"
                        placeholder="e.g., 5th Grade"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Add subject"
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={addSubjectToNewStudent}
                          className="btn btn-secondary btn-sm"
                        >
                          Add
                        </button>
                      </div>
                      {/* Display current subjects for this student */}
                      {newStudent.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {newStudent.subjects.map((subject, index) => (
                            <span key={index} className="badge badge-primary text-xs">
                              {subject}
                              <button
                                type="button"
                                onClick={() => removeSubjectFromNewStudent(index)}
                                className="ml-1 text-xs hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={newStudent.notes}
                        onChange={handleStudentInputChange}
                        className="input w-full"
                        rows="2"
                        placeholder="Any special notes about the student..."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleAddStudentToParent}
                      className="btn btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student to {selectedUser.firstName}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowManageStudentsModal(false)}
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

export default Users; 