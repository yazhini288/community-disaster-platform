const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  runAutoAllocate,
  previewAutoAllocate,
  getAllocationStats
} = require('../controllers/allocationController');

// Routes
router.post('/auto-allocate', protect, adminOnly, runAutoAllocate);
router.post('/preview', protect, adminOnly, previewAutoAllocate);
router.get('/stats', protect, getAllocationStats);

module.exports = router;
