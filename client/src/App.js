import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Appointments from './pages/Appointments';
import Schedules from './pages/Schedules';
import AvailableSchedules from './pages/AvailableSchedules';
import Students from './pages/Students';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Admin Routes */}
          <Route 
            path="users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin and Teacher Routes */}
          <Route 
            path="schedules" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'parent']}>
                <Schedules />
              </ProtectedRoute>
            } 
          />
          
          {/* Parent Routes */}
          <Route 
            path="available-schedules" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <AvailableSchedules />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="students" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <Students />
              </ProtectedRoute>
            } 
          />
          
          {/* All Authenticated Users */}
          <Route path="appointments" element={<Appointments />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App; 