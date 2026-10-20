import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import AutomatedAllocationHub from '../components/AutomatedAllocationHub.jsx';

export default function AdminPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState('allocation'); // 'allocation', 'resources', 'requests'
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newResource, setNewResource] = useState({
    name: '',
    category: 'water',
    quantity: 100,
    unit: 'bottles',
    location: ''
  });
  const [resMsg, setResMsg] = useState('');

  const loadData = () => {
    api.get('/resources').then((res) => setResources(res.data)).catch(() => {});
    api.get('/requests').then((res) => setRequests(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddResource = async (e) => {
    e.preventDefault();
    setResMsg('');
    try {
      await api.post('/resources', newResource);
      setResMsg('✅ New resource added to inventory successfully!');
      setNewResource({ name: '', category: 'water', quantity: 100, unit: 'bottles', location: '' });
      loadData();
    } catch (err) {
      setResMsg('❌ ' + (err.response?.data?.message || 'Failed to add resource.'));
    }
  };

  const handleUpdateStock = async (id, delta) => {
    const item = resources.find((r) => r._id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await api.put(`/resources/${id}`, { quantity: newQty });
      loadData();
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  return (
    <div className="container admin-container">
      {/* Admin Navigation Banner */}
      <div className="admin-nav-banner">
        <div>
          <h2>Emergency Management Admin Console</h2>
          <p className="subtitle">Oversee resource distribution, automated allocation, and field supplies.</p>
        </div>
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeAdminTab === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('allocation')}
          >
            ⚡ Auto-Allocation Engine
          </button>
          <button
            className={`admin-tab-btn ${activeAdminTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('resources')}
          >
            📦 Warehouse Inventory
          </button>
        </div>
      </div>

      {/* TAB 1: AUTOMATED ALLOCATION HUB */}
      {activeAdminTab === 'allocation' && (
        <AutomatedAllocationHub />
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {activeAdminTab === 'resources' && (
        <div className="resources-management-view">
          {/* Add New Resource Form */}
          <div className="card">
            <h3>➕ Add New Relief Stock to Warehouse</h3>
            {resMsg && <div className="alert-banner info" style={{ margin: '10px 0' }}>{resMsg}</div>}
            <form onSubmit={handleAddResource} className="add-resource-form">
              <div className="form-row-3">
                <div>
                  <label>Resource Name</label>
                  <input
                    placeholder="e.g. Bottled Drinking Water (1L)"
                    value={newResource.name}
                    onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={newResource.category}
                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                  >
                    <option value="water">💧 Water</option>
                    <option value="food">🍞 Food / Rations</option>
                    <option value="medical">🩹 Medical & First Aid</option>
                    <option value="shelter">⛺ Shelter & Blankets</option>
                    <option value="clothing">👕 Clothing</option>
                    <option value="other">📦 Other Supplies</option>
                  </select>
                </div>
                <div>
                  <label>Initial Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newResource.quantity}
                    onChange={(e) => setNewResource({ ...newResource, quantity: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <div>
                  <label>Unit of Measure</label>
                  <input
                    placeholder="e.g. boxes, bottles, packets, kits"
                    value={newResource.unit}
                    onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label>Storage / Warehouse Location</label>
                  <input
                    placeholder="e.g. Central Depot, Hub A"
                    value={newResource.location}
                    onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
                + Add Stock to Inventory
              </button>
            </form>
          </div>

          {/* Current Inventory Table */}
          <div className="card">
            <h3>Current Warehouse Stock</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>In Stock</th>
                    <th>Unit</th>
                    <th>Location</th>
                    <th>Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="badge-outline">{item.category}</span></td>
                      <td>
                        <strong className={item.quantity < 10 ? 'text-danger' : 'text-success'}>
                          {item.quantity}
                        </strong>
                      </td>
                      <td>{item.unit || 'units'}</td>
                      <td>{item.location || 'Central Depot'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-tiny btn-outline"
                            onClick={() => handleUpdateStock(item._id, +50)}
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            className="btn-tiny btn-outline"
                            onClick={() => handleUpdateStock(item._id, +10)}
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            className="btn-tiny btn-danger"
                            onClick={() => handleUpdateStock(item._id, -10)}
                            disabled={item.quantity <= 0}
                          >
                            -10
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
