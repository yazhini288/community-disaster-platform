import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';


export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, reqRes] = await Promise.all([
        api.get('/reports').catch(() => ({ data: [] })),
        api.get('/requests').catch(() => ({ data: [] }))
      ]);
      setReports(repRes.data || []);
      setRequests(reqRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Calculate statistics
  const criticalReports = reports.filter((r) => r.severity === 'critical').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const allocatedRequests = requests.filter((r) => r.status === 'allocated' || r.status === 'partially_allocated').length;
  const fulfilledRequests = requests.filter((r) => r.status === 'fulfilled').length;

  return (
    <div className="container dashboard-container">
      {/* Top Greeting & Action bar */}
      <div className="dashboard-hero">
        <div>
          <h2>Community Disaster Command Center</h2>
          <p className="subtitle">
            Welcome back, <strong>{user?.name}</strong> {user?.role === 'admin' && <span className="admin-chip">Administrator</span>}
          </p>
        </div>
        <div className="quick-nav-links">
          <Link to="/map" className="btn btn-outline">🗺️ Open Disaster Map</Link>
          <Link to="/report" className="btn btn-secondary">⚠️ Report Incident</Link>
          <Link to="/request" className="btn btn-primary">📦 Request Aid</Link>
        </div>
      </div>

      
      

      {/* STATS OVERVIEW CARDS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Critical Incidents</div>
          <div className="metric-value text-danger">{criticalReports}</div>
          <div className="metric-sub">{reports.length} total active incidents</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Pending Aid Requests</div>
          <div className="metric-value text-warning">{pendingRequests}</div>
          <div className="metric-sub">Awaiting resource allocation</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Supplies Allocated</div>
          <div className="metric-value text-primary">{allocatedRequests}</div>
          <div className="metric-sub">Matched & in dispatch pipeline</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Relief Delivered</div>
          <div className="metric-value text-success">{fulfilledRequests}</div>
          <div className="metric-sub">Successfully distributed</div>
        </div>
      </div>

      {/* ADMIN SHORTCUT BANNER */}
      {user?.role === 'admin' && (
        <div className="card admin-alert-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>⚡ Automated Resource Allocation Ready</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                Run the algorithmic matcher to automatically distribute warehouse stock to the most vulnerable citizens.
              </p>
            </div>
            <Link to="/admin" className="btn btn-primary">
              Open Allocation Hub &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* RECENT REQUESTS & STATUS TRACKER */}
      <div className="card">
        <div className="card-header-flex">
          <h3>📦 Real-Time Resource & Aid Requests</h3>
          <Link to="/request" className="btn-tiny btn-outline">+ New Request</Link>
        </div>

        {requests.length === 0 ? (
          <p style={{ padding: '16px 0', color: '#777' }}>No resource requests recorded yet.</p>
        ) : (
          <div className="requests-timeline">
            {requests.slice(0, 6).map((req) => (
              <div key={req._id} className="timeline-item">
                <div className="timeline-left">
                  <span className={`badge ${req.priority}`}>{req.priority}</span>
                  <strong>{req.resourceNeeded}</strong>
                  <span className="qty-tag">Qty: {req.quantity}</span>
                  {req.isVulnerable && <span className="vuln-pill">High Vulnerability</span>}
                </div>

                <div className="timeline-right">
                  <div className="status-progress-track">
                    <span className={`step-dot ${req.status ? 'active' : ''}`} title="Submitted"></span>
                    <span className={`step-line ${['allocated', 'partially_allocated', 'in_transit', 'fulfilled'].includes(req.status) ? 'active' : ''}`}></span>
                    <span className={`step-dot ${['allocated', 'partially_allocated', 'in_transit', 'fulfilled'].includes(req.status) ? 'active' : ''}`} title="Allocated"></span>
                    <span className={`step-line ${req.status === 'fulfilled' ? 'active' : ''}`}></span>
                    <span className={`step-dot ${req.status === 'fulfilled' ? 'active' : ''}`} title="Fulfilled"></span>
                  </div>
                  <span className={`badge ${
                    req.status === 'fulfilled' ? 'success' :
                    req.status === 'allocated' ? 'primary-badge' :
                    req.status === 'partially_allocated' ? 'warn' : 'medium'
                  }`}>
                    {req.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT DISASTER & HAZARD REPORTS */}
      <div className="card">
        <div className="card-header-flex">
          <h3>⚠️ Community Hazard & Incident Reports</h3>
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="select-filter"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <p style={{ padding: '16px 0', color: '#777' }}>No reports match the current filter.</p>
        ) : (
          <div className="reports-grid">
            {filteredReports.slice(0, 6).map((r) => (
              <div key={r._id} className="report-card-item">
                <div className="report-card-top">
                  <span className="report-type-badge">{r.type.replace('_', ' ').toUpperCase()}</span>
                  <span className={`badge ${r.severity}`}>{r.severity}</span>
                </div>
                <p className="report-desc">{r.description}</p>
                <div className="report-card-bottom">
                  <span className={`road-tag road-${r.roadStatus}`}>
                    🛣️ Road: {r.roadStatus?.replace('_', ' ')}
                  </span>
                  {r.location?.address && <span className="address-tag">📍 {r.location.address}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
