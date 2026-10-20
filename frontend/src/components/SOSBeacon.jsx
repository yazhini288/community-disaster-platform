import React, { useState } from 'react';
import api from '../api/axios.js';

export default function SOSBeacon({ onRequestSubmitted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState('Medical & First Aid');
  const [notes, setNotes] = useState('');
  const [locationStatus, setLocationStatus] = useState('Auto-detecting GPS...');
  const [coords, setCoords] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openModal = () => {
    setIsOpen(true);
    setSuccessMsg('');
    setErrorMsg('');
    // Try to get geolocation
    if ('geolocation' in navigator) {
      setLocationStatus('Acquiring your GPS coordinates...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLocationStatus(`📍 GPS Locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          setLocationStatus('⚠️ Could not access GPS. Responders will use registered location.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('GPS not supported by your browser.');
    }
  };

  const handleSendSOS = async () => {
    setSending(true);
    setErrorMsg('');
    try {
      await api.post('/requests', {
        resourceNeeded: `[EMERGENCY SOS] ${selectedEmergency}`,
        quantity: 1,
        priority: 'critical',
        isVulnerable: true,
        vulnerabilityTags: ['medical_dependency'],
        notes: notes ? `URGENT SOS: ${notes}` : `URGENT SOS broadcasted for ${selectedEmergency}`,
        location: coords ? { lat: coords.lat, lng: coords.lng, address: 'GPS Distress Beacon' } : undefined
      });

      setSuccessMsg('🚨 SOS BEACON TRANSMITTED! Emergency coordinators have your distress request marked as CRITICAL priority.');
      if (onRequestSubmitted) onRequestSubmitted();
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setNotes('');
      }, 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to transmit SOS. Please call local emergency services.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="sos-banner">
        <div className="sos-info">
          <span className="sos-pulse-dot"></span>
          <div>
            <strong>Need Immediate Emergency Assistance?</strong>
            <p>One-click distress broadcast with automatic GPS coordinates</p>
          </div>
        </div>
        <button type="button" className="btn btn-sos pulse-button" onClick={openModal}>
          🚨 TRANSMIT SOS ALERT
        </button>
      </div>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>🚨 Emergency Distress Broadcast</h3>
              <button className="btn-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {successMsg ? (
              <div className="sos-success-alert">
                <p>{successMsg}</p>
              </div>
            ) : (
              <div className="modal-body">
                <p className="sos-instruction">
                  This will immediately file a <strong>CRITICAL PRIORITY</strong> request dispatched to responders and automated supply allocation.
                </p>

                <div className="emergency-options">
                  {[
                    { label: '🚑 Medical & First Aid', val: 'Medical & First Aid' },
                    { label: '🌊 Rescue / Evacuation', val: 'Rescue / Evacuation' },
                    { label: '🍞 Food & Drinking Water', val: 'Food & Drinking Water' },
                    { label: '⛺ Shelter / Blankets', val: 'Emergency Shelter' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      className={`emergency-btn ${selectedEmergency === item.val ? 'selected' : ''}`}
                      onClick={() => setSelectedEmergency(item.val)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="location-pill">
                  {locationStatus}
                </div>

                <label style={{ marginTop: 14 }}>Additional Details (number of people, injuries, landmark):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3 people trapped on 1st floor near temple..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                {errorMsg && <div className="alert-banner error" style={{ marginTop: 10 }}>{errorMsg}</div>}

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)} disabled={sending}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-sos" onClick={handleSendSOS} disabled={sending}>
                    {sending ? 'Transmitting Distress Beacon...' : '🚨 Broadcast SOS Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
