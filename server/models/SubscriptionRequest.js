const mongoose = require('mongoose');

const subscriptionRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  plan: {
    type: String,
    required: [true, 'Please select a subscription plan'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new'
  },
  closedBy: {
    type: String,
    trim: true,
    default: ''
  },
  closedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);
