const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'volunteer', 'admin'], default: 'user' },
    phone: { type: String, trim: true },
    isVulnerable: { type: Boolean, default: false },
    vulnerabilityTags: [{ type: String, enum: ['elderly', 'disabled', 'child', 'pregnant', 'medical_dependency', 'other'] }],
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
