const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createRequest, getRequests, updateRequest, deleteRequest } = require('../controllers/requestController');

router.route('/')
  .get(protect, getRequests)
  .post(protect, createRequest);

router.route('/:id')
  .put(protect, updateRequest)
  .delete(protect, deleteRequest);

module.exports = router;
