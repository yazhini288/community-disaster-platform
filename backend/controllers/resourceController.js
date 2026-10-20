const Resource = require('../models/Resource');

const createResource = async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, managedBy: req.user.id });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getResources = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createResource, getResources, updateResource, deleteResource };
