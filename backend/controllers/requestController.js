const Request = require('../models/Request');
const { calculatePriorityScore } = require('../services/allocationService');

const createRequest = async (req, res) => {
  try {
    const priorityScore = calculatePriorityScore(req.body);
    const request = await Request.create({
      ...req.body,
      priorityScore,
      requestedBy: req.user.id
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const { priority, status, isVulnerable } = req.query;
    const filter = {};
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (isVulnerable) filter.isVulnerable = isVulnerable === 'true';
    const requests = await Request.find(filter)
      .populate('requestedBy', 'name email phone')
      .populate('allocatedResource', 'name category unit location')
      .sort({ priorityScore: -1, createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRequest, getRequests, updateRequest, deleteRequest };
