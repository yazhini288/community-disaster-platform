import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MapView from './pages/MapView.jsx';
import ReportForm from './pages/ReportForm.jsx';
import RequestForm from './pages/RequestForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import AutomatedAllocationHub from './components/AutomatedAllocationHub.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><RequestForm /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        <Route path="/allocation" element={<ProtectedRoute adminOnly><div className="container"><AutomatedAllocationHub /></div></ProtectedRoute>} />
      </Routes>
    </>
  );
}
