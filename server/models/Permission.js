const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'editor'],
    unique: true
  },
  services: {
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  projects: {
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  blogs: {
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  leads: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  subscriptionRequests: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  subscriptions: {
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  },
  settings: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: false }
  },
  users: {
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
