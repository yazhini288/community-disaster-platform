import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function ReportForm() {
  const [form, setForm] = useState({
    type: 'flood',
    description: '',
    roadStatus: 'unknown',
    severity: 'medium',
    lat: '',
    lng: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocation not supported in this browser.');
      return;
    }
    setGpsStatus('Fetching GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          address: prev.address || 'GPS Coordinates'
        }));
        setGpsStatus('📍 Location captured successfully!');
      },
      (err) => {
        setGpsStatus('⚠️ Could not obtain GPS. Please enter coordinates manually.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reports', {
        type: form.type,
        description: form.description,
        roadStatus: form.roadStatus,
        severity: form.severity,
        location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng), address: form.address }
      });
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 540 }}>
      <div className="card">
        <h2>⚠️ Report Disaster / Road Condition</h2>
        <p className="subtitle">Submit verified incident hazards to warn the community and responders.</p>

        {error && <div className="alert-banner error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Hazard / Disaster Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="flood">🌊 Flood / Waterlogging</option>
            <option value="road_block">🚧 Road Block / Fallen Tree</option>
            <option value="fire">🔥 Fire Outbreak</option>
            <option value="earthquake">🏚️ Building Collapse / Earthquake</option>
            <option value="other">⚠️ Other Incident</option>
          </select>

          <label>Detailed Description</label>
          <textarea
            rows={3}
            placeholder="Describe what happened, water level, blocked lanes, or danger..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Road Status</label>
              <select value={form.roadStatus} onChange={(e) => setForm({ ...form, roadStatus: e.target.value })}>
                <option value="usable">✅ Usable / Clear</option>
                <option value="partially_blocked">⚠️ Partially Blocked</option>
                <option value="blocked">🚫 Completely Blocked</option>
                <option value="unknown">❓ Unknown</option>
              </select>
            </div>

            <div>
              <label>Severity Level</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low (Minor Delay)</option>
                <option value="medium">Medium (Moderate Hazard)</option>
                <option value="high">High (Dangerous)</option>
                <option value="critical">Critical (Life Threatening)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>Incident Location</label>
            <button type="button" className="btn-tiny btn-outline" onClick={handleGetLocation}>
              📍 Detect My GPS
            </button>
          </div>
          {gpsStatus && <div style={{ fontSize: '0.8rem', color: '#1F4E6B', marginBottom: 8 }}>{gpsStatus}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 13.0827"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 80.2707"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                required
              />
            </div>
          </div>

          <label>Address / Landmark (optional)</label>
          <input
            placeholder="e.g. Near Central Station, Anna Salai"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>
            🚨 Submit Hazard Report
          </button>
        </form>
      </div>
    </div>
  );
}
