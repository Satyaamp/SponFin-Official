const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: ['service', 'project', 'blog', 'lead', 'settings', 'user', 'subscription', 'subscription_request', 'permissions'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
