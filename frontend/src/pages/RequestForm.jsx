import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const TAGS = ['elderly', 'disabled', 'child', 'pregnant', 'medical_dependency', 'other'];

export default function RequestForm() {
  const [form, setForm] = useState({
    resourceNeeded: '',
    quantity: 1,
    notes: '',
    isVulnerable: false,
    vulnerabilityTags: [],
    priority: 'medium'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      vulnerabilityTags: f.vulnerabilityTags.includes(tag)
        ? f.vulnerabilityTags.filter((t) => t !== tag)
        : [...f.vulnerabilityTags, tag]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/requests', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h2>Request resources / help</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Resource needed</label>
          <input value={form.resourceNeeded} onChange={(e) => setForm({ ...form, resourceNeeded: e.target.value })} required />

          <label>Quantity</label>
          <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />

          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <label>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <label>
            <input
              type="checkbox"
              style={{ width: 'auto', marginRight: 8 }}
              checked={form.isVulnerable}
              onChange={(e) => setForm({ ...form, isVulnerable: e.target.checked })}
            />
            This request involves an elderly or disabled person
          </label>

          {form.isVulnerable && (
            <div style={{ marginBottom: 14 }}>
              {TAGS.map((tag) => (
                <label key={tag} style={{ display: 'block', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto', marginRight: 8 }}
                    checked={form.vulnerabilityTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  {tag.replace('_', ' ')}
                </label>
              ))}
            </div>
          )}

          <button type="submit">Submit request</button>
        </form>
      </div>
    </div>
  );
}
