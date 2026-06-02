const SubscriptionRequest = require('../models/SubscriptionRequest');
const { logActivity } = require('../utils/logger');

// @desc    Create new subscription request
// @route   POST /api/subscription-requests
// @access  Public
exports.createSubscriptionRequest = async (req, res, next) => {
  try {
    const { name, email, phone, company, plan, message } = req.body;

    if (!name || !email || !plan || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, plan, and message' });
    }

    const request = await SubscriptionRequest.create({
      name,
      email,
      phone,
      company,
      plan,
      message
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subscription requests
// @route   GET /api/subscription-requests
// @access  Private (Admin/SuperAdmin/Editor)
exports.getSubscriptionRequests = async (req, res, next) => {
  try {
    const requests = await SubscriptionRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subscription request status
// @route   PUT /api/subscription-requests/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateSubscriptionRequest = async (req, res, next) => {
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

    const request = await SubscriptionRequest.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Subscription request not found' });
    }

    await logActivity('Update', 'subscription_request', `Updated subscription request status to: "${request.status}" for "${request.name}"`, req.user);
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subscription request
// @route   DELETE /api/subscription-requests/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteSubscriptionRequest = async (req, res, next) => {
  try {
    const request = await SubscriptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Subscription request not found' });
    }

    await SubscriptionRequest.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'subscription_request', `Deleted subscription request: "${request.name}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
