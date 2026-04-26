import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import { useAuth } from './context/AuthContext';

import StudentDashboard from './pages/Dashboard/StudentDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import BooksCatalog from './pages/Books/BooksCatalog';


import Profile from './pages/Profile/Profile';
import FineRequests from './pages/Profile/FineRequests';
import Reservations from './pages/Profile/Reservations';
import Settings from './pages/Settings/Settings';



import AdminInventory from './pages/Admin/AdminInventory';
import IssueManagement from './pages/Admin/IssueManagement';
import FineApproval from './pages/Admin/FineApproval';
import GeneralRequests from './pages/Admin/GeneralRequests';
import GunStation from './pages/Dashboard/GunStation';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout role={user?.role} userName={user?.name} />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Common / Shared Views */}
          <Route path="dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />} />
          <Route path="catalog" element={<BooksCatalog />} />


          <Route path="profile" element={<Profile />} />
          <Route path="fine-requests" element={<FineRequests />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="gun-station" element={<GunStation />} />

          {/* Admin Exclusive Views */}
          <Route path="admin/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/inventory" element={<ProtectedRoute requireAdmin={true}><AdminInventory /></ProtectedRoute>} />
          <Route path="admin/issues" element={<ProtectedRoute requireAdmin={true}><IssueManagement /></ProtectedRoute>} />
          <Route path="admin/fines" element={<ProtectedRoute requireAdmin={true}><FineApproval /></ProtectedRoute>} />
          <Route path="admin/requests" element={<ProtectedRoute requireAdmin={true}><GeneralRequests /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
