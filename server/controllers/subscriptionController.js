const SubscriptionPlan = require('../models/SubscriptionPlan');
const { logActivity } = require('../utils/logger');

// @desc    Get all subscription plans
// @route   GET /api/subscriptions
// @access  Public (returns active only) / Admin (returns all if queried)
exports.getSubscriptions = async (req, res, next) => {
  try {
    const isEditing = req.query.admin === 'true';
    const filter = isEditing ? {} : { isActive: true };
    
    const plans = await SubscriptionPlan.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subscription plan
// @route   GET /api/subscriptions/:id
// @access  Public
exports.getSubscription = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new subscription plan
// @route   POST /api/subscriptions
// @access  Private (Admin/SuperAdmin/Editor)
exports.createSubscription = async (req, res, next) => {
  try {
    const { title, price, description, objective, features, displayOrder, isActive } = req.body;

    const plan = await SubscriptionPlan.create({
      title,
      price,
      description,
      objective,
      features,
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive === 'true' || isActive === true
    });

    await logActivity('Create', 'subscription', `Created subscription plan: "${plan.title}"`, req.user);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subscription plan
// @route   PUT /api/subscriptions/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateSubscription = async (req, res, next) => {
  try {
    let plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    const { title, price, description, objective, features, displayOrder, isActive } = req.body;
    
    plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      {
        title,
        price,
        description,
        objective,
        features,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : plan.displayOrder,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : plan.isActive
      },
      { new: true, runValidators: true }
    );

    await logActivity('Update', 'subscription', `Updated subscription plan: "${plan.title}"`, req.user);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subscription plan
// @route   DELETE /api/subscriptions/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteSubscription = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);

    await logActivity('Delete', 'subscription', `Deleted subscription plan: "${plan.title}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
