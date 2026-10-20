import React, { useState, useEffect } from 'react';
import api from '../api/axios.js';

export default function AutomatedAllocationHub() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [allocationResult, setAllocationResult] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'critical', 'allocated', 'deficits'
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqRes, resRes] = await Promise.all([
        api.get('/allocation/stats').catch(() => ({ data: { data: null } })),
        api.get('/requests'),
        api.get('/resources')
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      setRequests(reqRes.data || []);
      setResources(resRes.data || []);
    } catch (err) {
      console.error('Error fetching allocation hub data:', err);
      setMessage({ text: 'Failed to load allocation data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run dry-run simulation
  const handlePreview = async () => {
    setActionLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/allocation/preview');
      setPreviewResult(res.data.data);
      setMessage({
        text: `Simulation complete: ${res.data.data.summary.fullyAllocatedCount} requests can be fully satisfied.`,
        type: 'info'
      });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Simulation failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Run actual automated allocation (commits to DB)
  const handleRunAllocation = async () => {
    if (!window.confirm('Run Automated Resource Allocation? Available inventory will be allocated to highest-priority requests.')) {
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/allocation/auto-allocate');
      setAllocationResult(res.data.data);
      setPreviewResult(null);
      setMessage({
        text: `Auto-Allocation Executed! Dispatched ${res.data.data.summary.totalUnitsDispatched} units across ${res.data.data.summary.fullyAllocatedCount + res.data.data.summary.partiallyAllocatedCount} requests.`,
        type: 'success'
      });
      await fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Allocation execution failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Update status manually
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await api.put(`/requests/${requestId}`, { status: newStatus });
      setMessage({ text: `Request status updated to "${newStatus}".`, type: 'success' });
      fetchData();
    } catch (err) {
      setMessage({ text: 'Failed to update request status.', type: 'error' });
    }
  };

  // Filter requests based on tab
  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'critical') return r.priority === 'critical' || r.isVulnerable;
    if (activeTab === 'allocated') return r.status === 'allocated' || r.status === 'partially_allocated';
    if (activeTab === 'pending') return r.status === 'pending';
    return true;
  });

  return (
    <div className="allocation-hub">
      {/* Header & Quick Actions */}
      <div className="hub-header">
        <div>
          <h2>⚡ Automated Resource Allocation Engine</h2>
          <p className="subtitle">
            Smart algorithmic matching based on vulnerability scoring, urgency, and live inventory.
          </p>
        </div>
        <div className="hub-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={actionLoading || loading}
          >
            {actionLoading ? 'Simulating...' : '🔍 Simulate / Preview'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunAllocation}
            disabled={actionLoading || loading}
          >
            {actionLoading ? 'Allocating...' : '⚡ Run Auto-Allocation'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchData}
            title="Refresh"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message.text && (
        <div className={`alert-banner ${message.type}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Critical Requests</div>
          <div className="metric-value text-danger">
            {requests.filter((r) => r.priority === 'critical' && r.status === 'pending').length}
          </div>
          <div className="metric-sub">Pending immediate response</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Allocated & In-Transit</div>
          <div className="metric-value text-warning">
            {requests.filter((r) => r.status === 'allocated' || r.status === 'partially_allocated').length}
          </div>
          <div className="metric-sub">Supplies actively matched</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Fulfilled Relief</div>
          <div className="metric-value text-success">
            {requests.filter((r) => r.status === 'fulfilled').length}
          </div>
          <div className="metric-sub">Delivered to affected citizens</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Available Stock Items</div>
          <div className="metric-value text-navy">
            {resources.reduce((sum, r) => sum + (r.quantity || 0), 0)}
          </div>
          <div className="metric-sub">{resources.length} unique supply types</div>
        </div>
      </div>

      {/* SIMULATION / PREVIEW DRAWER */}
      {previewResult && (
        <div className="card simulation-card">
          <div className="simulation-header">
            <div>
              <h3>🧪 Allocation Simulation Preview (Dry Run)</h3>
              <p>Review the calculated matching before saving changes to inventory.</p>
            </div>
            <button className="btn btn-small btn-primary" onClick={handleRunAllocation}>
              Confirm & Execute Allocation
            </button>
          </div>

          <div className="sim-summary-bar">
            <span>Evaluated: <strong>{previewResult.summary.totalRequestsEvaluated}</strong></span>
            <span>Can Fully Satisfy: <strong className="text-success">{previewResult.summary.fullyAllocatedCount}</strong></span>
            <span>Partial: <strong className="text-warning">{previewResult.summary.partiallyAllocatedCount}</strong></span>
            <span>Deficits / Shortages: <strong className="text-danger">{previewResult.summary.unmetRequestsCount}</strong></span>
            <span>Projected Fulfillment: <strong>{previewResult.summary.fulfillmentRatePercentage}%</strong></span>
          </div>

          {previewResult.allocations.length > 0 ? (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Citizen</th>
                    <th>Needed Item</th>
                    <th>Match Found</th>
                    <th>Allocated Units</th>
                    <th>Projected Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.allocations.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`badge ${a.priority}`}>{a.priority}</span>
                        <small style={{ display: 'block', color: '#666' }}>Score: {a.priorityScore}</small>
                      </td>
                      <td><strong>{a.requestedBy}</strong></td>
                      <td>{a.resourceNeeded} (needs {a.targetQuantity})</td>
                      <td><span className="stock-tag">{a.resourceName}</span></td>
                      <td><strong>{a.allocatedAmount}</strong> {a.unit}</td>
                      <td>
                        <span className={`badge ${a.status === 'allocated' ? 'success' : 'warn'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: 12, color: '#666' }}>No eligible pending requests match currently available inventory.</p>
          )}

          {previewResult.deficits.length > 0 && (
            <div className="deficits-box">
              <h4>⚠️ Supply Deficits (Additional Stocks Needed)</h4>
              <ul>
                {previewResult.deficits.map((d, i) => (
                  <li key={i}>
                    <strong>{d.resourceNeeded}</strong>: Shortfall of {d.shortfall} units. ({d.reason})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* LIVE ALLOCATION RESULT BANNER */}
      {allocationResult && (
        <div className="card live-result-card">
          <div className="live-result-header">
            <h3>✅ Allocation Run Succeeded</h3>
            <button className="btn-close" onClick={() => setAllocationResult(null)}>✕</button>
          </div>
          <p>
            Processed <strong>{allocationResult.summary.totalRequestsEvaluated}</strong> requests.
            Successfully dispatched <strong>{allocationResult.summary.totalUnitsDispatched} units</strong>.
            Fulfillment rate achieved: <strong>{allocationResult.summary.fulfillmentRatePercentage}%</strong>.
          </p>
        </div>
      )}

      {/* FILTER TABS & REQUESTS TABLE */}
      <div className="card">
        <div className="table-header-tabs">
          <h3>Emergency Resource Requests</h3>
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({requests.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({requests.filter((r) => r.status === 'pending').length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveTab('critical')}
            >
              Critical / Vulnerable ({requests.filter((r) => r.priority === 'critical' || r.isVulnerable).length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'allocated' ? 'active' : ''}`}
              onClick={() => setActiveTab('allocated')}
            >
              Allocated ({requests.filter((r) => r.status === 'allocated' || r.status === 'partially_allocated').length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <p style={{ padding: '20px 0', color: '#666', textAlign: 'center' }}>No requests in this category.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Priority & Score</th>
                  <th>Resource Needed</th>
                  <th>Vulnerability</th>
                  <th>Quantity</th>
                  <th>Allocated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className={`badge ${r.priority}`}>{r.priority}</span>
                      {r.priorityScore ? (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>
                          Score: {r.priorityScore}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <strong>{r.resourceNeeded}</strong>
                      {r.notes && <div style={{ fontSize: '0.8rem', color: '#777' }}>{r.notes}</div>}
                    </td>
                    <td>
                      {r.isVulnerable ? (
                        <div className="vuln-tags">
                          <span className="badge high">Vulnerable</span>
                          {r.vulnerabilityTags && r.vulnerabilityTags.map((tag) => (
                            <span key={tag} className="tag-pill">{tag.replace('_', ' ')}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.85rem' }}>Standard</span>
                      )}
                    </td>
                    <td>{r.quantity}</td>
                    <td>
                      <strong>{r.allocatedQuantity || 0}</strong> / {r.quantity}
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'fulfilled' ? 'success' :
                        r.status === 'allocated' ? 'primary-badge' :
                        r.status === 'partially_allocated' ? 'warn' :
                        r.status === 'rejected' ? 'danger' : 'medium'
                      }`}>
                        {r.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        {r.status === 'allocated' && (
                          <button
                            className="btn-tiny btn-success"
                            onClick={() => handleStatusChange(r._id, 'fulfilled')}
                            title="Mark as delivered"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {r.status === 'pending' && (
                          <button
                            className="btn-tiny btn-primary"
                            onClick={() => handleStatusChange(r._id, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'rejected' && r.status !== 'fulfilled' && (
                          <button
                            className="btn-tiny btn-danger"
                            onClick={() => handleStatusChange(r._id, 'rejected')}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVENTORY BREAKDOWN */}
      <div className="card">
        <h3>📦 Live Warehouse Inventory Status</h3>
        <div className="inventory-grid">
          {resources.map((res) => (
            <div key={res._id} className="inventory-item-card">
              <div className="inv-title">{res.name}</div>
              <div className="inv-category badge-outline">{res.category}</div>
              <div className={`inv-qty ${res.quantity < 10 ? 'text-danger' : 'text-success'}`}>
                {res.quantity} <span style={{ fontSize: '0.8rem' }}>{res.unit || 'units'}</span>
              </div>
              {res.location && <div className="inv-loc">📍 {res.location}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
