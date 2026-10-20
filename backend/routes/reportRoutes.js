const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReport, getReports, updateReport, deleteReport } = require('../controllers/reportController');

router.route('/')
  .get(getReports)
  .post(protect, createReport);

router.route('/:id')
  .put(protect, updateReport)
  .delete(protect, deleteReport);

module.exports = router;
