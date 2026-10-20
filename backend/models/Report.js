const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['flood', 'road_block', 'fire', 'earthquake', 'other'], required: true },
    description: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String }
    },
    roadStatus: { type: String, enum: ['usable', 'blocked', 'partially_blocked', 'unknown'], default: 'unknown' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['pending', 'verified', 'resolved'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
