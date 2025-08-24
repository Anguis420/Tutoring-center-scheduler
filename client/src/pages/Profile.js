import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  Users,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    children: [],
    subjects: [],
    qualifications: '',
    experience: '',
    hourlyRate: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        children: user.children || [],
        subjects: user.subjects || [],
        qualifications: user.qualifications || '',
        experience: user.experience || '',
        hourlyRate: user.hourlyRate || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const getRoleDisplayName = () => {
    const roleMap = {
      admin: 'Administrator',
      teacher: 'Teacher',
      parent: 'Parent'
    };
    return roleMap[user?.role] || 'User';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="firstName" className="label">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="label">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="email" className="label">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      disabled
                      className="input bg-gray-50"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone" className="label">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                </div>

                {/* Role-specific fields */}
                {user.role === 'parent' && (
                  <div className="form-group">
                    <label className="label">Children</label>
                    {formData.children.map((child, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={child.name || ''}
                          onChange={(e) => handleArrayInputChange('children', index, { ...child, name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Child name"
                          className="input flex-1"
                        />
                        <input
                          type="number"
                          value={child.age || ''}
                          onChange={(e) => handleArrayInputChange('children', index, { ...child, age: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Age"
                          className="input w-20"
                          min="3"
                          max="18"
                        />
                        <input
                          type="text"
                          value={child.grade || ''}
                          onChange={(e) => handleArrayInputChange('children', index, { ...child, grade: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Grade"
                          className="input w-24"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('children', index)}
                            className="btn btn-danger btn-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => addArrayItem('children')}
                        className="btn btn-secondary btn-sm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Add Child
                      </button>
                    )}
                  </div>
                )}

                {user.role === 'teacher' && (
                  <>
                    <div className="form-group">
                      <label className="label">Subjects</label>
                      {formData.subjects.map((subject, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => handleArrayInputChange('subjects', index, e.target.value)}
                            disabled={!isEditing}
                            placeholder="Subject"
                            className="input flex-1"
                          />
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('subjects', index)}
                              className="btn btn-danger btn-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => addArrayItem('subjects')}
                          className="btn btn-secondary btn-sm"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Add Subject
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="qualifications" className="label">Qualifications</label>
                        <input
                          type="text"
                          id="qualifications"
                          name="qualifications"
                          value={formData.qualifications}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="experience" className="label">Years of Experience</label>
                        <input
                          type="number"
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="hourlyRate" className="label">Hourly Rate ($)</label>
                      <input
                        type="number"
                        id="hourlyRate"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn btn-primary">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data
                        setFormData({
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          phone: user.phone || '',
                          children: user.children || [],
                          subjects: user.subjects || [],
                          qualifications: user.qualifications || '',
                          experience: user.experience || '',
                          hourlyRate: user.hourlyRate || ''
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
            </div>
            <div className="card-body">
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="btn btn-secondary"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="currentPassword" className="label">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword" className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="input pr-10"
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn btn-primary">
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="btn btn-secondary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Summary</h3>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-primary-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </h4>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="badge badge-primary mt-2">{getRoleDisplayName()}</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{user.phone || 'No phone number'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 