const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['food', 'water', 'medical', 'shelter', 'clothing', 'other'], required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'units' },
    isPerishable: { type: Boolean, default: false },
    expiryDate: { type: Date },
    location: { type: String },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
