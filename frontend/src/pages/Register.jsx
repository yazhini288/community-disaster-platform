import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const TAGS = [
  { id: 'elderly', label: '👴 Elderly (65+)' },
  { id: 'disabled', label: '♿ Person with Disability' },
  { id: 'child', label: '👶 Infant / Young Children' },
  { id: 'pregnant', label: '🤰 Expectant Mother' },
  { id: 'medical_dependency', label: '💊 Medical Dependency (Insulin, Dialysis, etc.)' },
  { id: 'other', label: '⚠️ Other Special Needs' }
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isVulnerable: false,
    vulnerabilityTags: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleTag = (tagId) => {
    setForm((f) => ({
      ...f,
      vulnerabilityTags: f.vulnerabilityTags.includes(tagId)
        ? f.vulnerabilityTags.filter((t) => t !== tagId)
        : [...f.vulnerabilityTags, tagId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <div className="auth-icon-badge">📋</div>
          <h2>Join the Community</h2>
          <p className="subtitle">Register to receive aid, report incidents, or coordinate relief</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create a secure password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <label>Phone Number (for emergency SMS / dispatch)</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <div className="vulnerability-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isVulnerable}
                onChange={(e) => setForm({ ...form, isVulnerable: e.target.checked })}
              />
              <span>I or a household member need special assistance in emergencies</span>
            </label>

            {form.isVulnerable && (
              <div className="tag-checkbox-list">
                <p className="tag-helper">Select all that apply for priority automated resource allocation:</p>
                {TAGS.map((tag) => (
                  <label key={tag.id} className="tag-checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.vulnerabilityTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span>{tag.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ width: '100%', marginTop: 22, padding: '12px' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
