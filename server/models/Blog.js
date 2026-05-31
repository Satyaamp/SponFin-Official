const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a blog title'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  seoTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  featuredImage: {
    type: String,
    required: [true, 'Please provide a featured image URL']
  },
  publicId: {
    type: String,
    required: [true, 'Please provide an image public ID']
  },
  content: {
    type: String,
    required: [true, 'Please provide the blog content']
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slug and seoTitle/metaDescription placeholders if not provided
blogSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    if (!this.seoTitle) {
      this.seoTitle = this.title;
    }
  }
  
  if (!this.metaDescription && this.content) {
    // strip HTML tags and get first 150 chars
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.metaDescription = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }
  
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
