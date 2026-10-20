const Report = require('../models/Report');

const createReport = async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, reportedBy: req.user.id });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { type, roadStatus, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (roadStatus) filter.roadStatus = roadStatus;
    if (status) filter.status = status;
    const reports = await Report.find(filter).populate('reportedBy', 'name email').sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReport, getReports, updateReport, deleteReport };
