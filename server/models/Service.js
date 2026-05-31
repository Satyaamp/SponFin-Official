const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  shortDescription: {
    type: String,
    required: [true, 'Please provide a short description'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a detailed description'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image url']
  },
  publicId: {
    type: String,
    required: [true, 'Please provide an image public ID']
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

module.exports = mongoose.model('Service', serviceSchema);
