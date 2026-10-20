const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createResource, getResources, updateResource, deleteResource } = require('../controllers/resourceController');

router.route('/')
  .get(getResources)
  .post(protect, adminOnly, createResource);

router.route('/:id')
  .put(protect, adminOnly, updateResource)
  .delete(protect, adminOnly, deleteResource);

module.exports = router;
