const Lead = require('../models/Lead');
const { logActivity } = require('../utils/logger');

// @desc    Create new lead (Contact form submission)
// @route   POST /api/leads
// @access  Public
exports.createLead = async (req, res, next) => {
  try {
    const { name, email, phone, company, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and message' });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      service,
      message
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private (Admin/SuperAdmin/Editor)
exports.getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead status
// @route   PUT /api/leads/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateLead = async (req, res, next) => {
  try {
    const { status, closedBy } = req.body;

    if (!status || !['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status: new, contacted, closed' });
    }

    const updateFields = { status };
    if (status === 'closed') {
      updateFields.closedBy = closedBy || '';
      updateFields.closedAt = new Date();
    } else {
      updateFields.closedBy = '';
      updateFields.closedAt = null;
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await logActivity('Update', 'lead', `Updated lead status to: "${lead.status}" for "${lead.name}"`, req.user);
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await Lead.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'lead', `Deleted lead: "${lead.name}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
