import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <Link to="/" style={{ fontWeight: 'bold' }}>
        Disaster Care & Relief
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/map">Disaster Map</Link>
            <Link to="/report">Report Hazard</Link>
            <Link to="/request">Request Aid</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="nav-admin-link">⚙️ Admin</Link>
                <Link to="/allocation" className="nav-highlight">⚡ Auto-Allocation</Link>
              </>
            )}
            <a href="#" onClick={handleLogout} className="nav-logout">Logout</a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
