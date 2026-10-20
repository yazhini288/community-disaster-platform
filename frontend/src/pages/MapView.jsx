import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios.js';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const roadColor = {
  usable: '#2F9E44',
  blocked: '#D64550',
  partially_blocked: '#E8871E',
  unknown: '#5B6B78'
};

export default function MapView() {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterRoad, setFilterRoad] = useState('all');

  useEffect(() => {
    api.get('/reports')
      .then((res) => setReports(res.data || []))
      .catch((err) => console.error('Error fetching reports for map:', err));
  }, []);

  const filteredReports = reports.filter((r) => {
    if (!r.location || r.location.lat == null || r.location.lng == null) return false;
    const matchType = filterType === 'all' || r.type === filterType;
    const matchRoad = filterRoad === 'all' || r.roadStatus === filterRoad;
    return matchType && matchRoad;
  });

  const center = filteredReports.length > 0
    ? [filteredReports[0].location.lat, filteredReports[0].location.lng]
    : [13.0827, 80.2707]; // Chennai default

  const blockedCount = reports.filter((r) => r.roadStatus === 'blocked').length;
  const usableCount = reports.filter((r) => r.roadStatus === 'usable').length;
  const criticalCount = reports.filter((r) => r.severity === 'critical').length;

  return (
    <div className="container map-page-container">
      <div className="map-header">
        <div>
          <h2>🗺️ Live Community Disaster & Hazard Map</h2>
          <p className="subtitle">Real-time incident tracking, road conditions, and danger zones</p>
        </div>

        {/* Quick summary counters */}
        <div className="map-summary-pills">
          <span className="summary-pill pill-danger">🚫 {blockedCount} Blocked Roads</span>
          <span className="summary-pill pill-success">✅ {usableCount} Usable Routes</span>
          <span className="summary-pill pill-warning">⚠️ {criticalCount} Critical Spots</span>
        </div>
      </div>

      {/* Interactive Map Filter Controls */}
      <div className="card map-filter-card">
        <div className="filter-group">
          <label>Filter by Incident Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Incident Types ({reports.length})</option>
            <option value="flood">🌊 Flood</option>
            <option value="road_block">🚧 Road Block</option>
            <option value="fire">🔥 Fire</option>
            <option value="earthquake">🏚️ Earthquake</option>
            <option value="other">⚠️ Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Road Status:</label>
          <select value={filterRoad} onChange={(e) => setFilterRoad(e.target.value)}>
            <option value="all">All Road Statuses</option>
            <option value="blocked">🚫 Blocked Only</option>
            <option value="partially_blocked">⚠️ Partially Blocked</option>
            <option value="usable">✅ Clear & Usable</option>
          </select>
        </div>

        <div className="filter-status-info">
          Showing <strong>{filteredReports.length}</strong> markers on map
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="map-wrapper card">
        <MapContainer center={center} zoom={12} className="leaflet-map" style={{ height: '520px', width: '100%', borderRadius: 8 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredReports.map((r) => (
            <Marker key={r._id} position={[r.location.lat, r.location.lng]}>
              <Popup>
                <div className="map-popup">
                  <div className="popup-top">
                    <span className="popup-type">{r.type.toUpperCase()}</span>
                    <span className={`badge ${r.severity}`}>{r.severity}</span>
                  </div>
                  <p className="popup-desc">{r.description}</p>
                  <div className="popup-road-status" style={{ borderLeft: `4px solid ${roadColor[r.roadStatus] || '#555'}` }}>
                    <strong>Road Condition:</strong> <span style={{ color: roadColor[r.roadStatus] }}>{r.roadStatus?.replace('_', ' ')}</span>
                  </div>
                  {r.location.address && (
                    <div className="popup-address">📍 {r.location.address}</div>
                  )}
                  <small style={{ color: '#888', display: 'block', marginTop: 4 }}>
                    Coordinates: {r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}
                  </small>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
