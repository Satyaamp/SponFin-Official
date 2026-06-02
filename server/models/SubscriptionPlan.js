const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  price: {
    type: String,
    required: [true, 'Please provide a price'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  objective: {
    type: String,
    trim: true
  },
  features: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
