const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a project title'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Website', 'Mobile App', 'Analytics', 'Marketing']
  },
  description: {
    type: String,
    required: [true, 'Please provide a project description']
  },
  technologies: {
    type: [String],
    default: []
  },
  images: [
    {
      imageUrl: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      }
    }
  ],
  projectUrl: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create project slug from title before saving
projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
