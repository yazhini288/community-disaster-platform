const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resourceNeeded: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    notes: { type: String },
    isVulnerable: { type: Boolean, default: false },
    vulnerabilityTags: [{ type: String, enum: ['elderly', 'disabled', 'child', 'pregnant', 'medical_dependency', 'other'] }],
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    priorityScore: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'allocated', 'partially_allocated', 'in_transit', 'fulfilled', 'rejected'], default: 'pending' },
    allocatedQuantity: { type: Number, default: 0 },
    allocatedResource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    allocatedAt: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
