const allocationService = require('../services/allocationService');

// @desc    Run automated resource allocation (commits changes)
// @route   POST /api/allocation/auto-allocate
// @access  Private (Admin)
const runAutoAllocate = async (req, res) => {
  try {
    const result = await allocationService.executeAllocation({ dryRun: false });
    res.status(200).json({
      success: true,
      message: 'Automated resource allocation completed successfully',
      data: result
    });
  } catch (err) {
    console.error('Error running auto-allocation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Preview automated allocation without modifying database
// @route   POST /api/allocation/preview
// @access  Private (Admin)
const previewAutoAllocate = async (req, res) => {
  try {
    const result = await allocationService.executeAllocation({ dryRun: true });
    res.status(200).json({
      success: true,
      message: 'Allocation preview simulated successfully',
      data: result
    });
  } catch (err) {
    console.error('Error previewing auto-allocation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get allocation and inventory health statistics
// @route   GET /api/allocation/stats
// @access  Private
const getAllocationStats = async (req, res) => {
  try {
    const stats = await allocationService.getAllocationStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('Error getting allocation stats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  runAutoAllocate,
  previewAutoAllocate,
  getAllocationStats
};
