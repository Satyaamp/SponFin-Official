const Blog = require('../models/Blog');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const fs = require('fs');
const { logActivity } = require('../utils/logger');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public (published only) / Admin (all)
exports.getBlogs = async (req, res, next) => {
  try {
    const isEditing = req.query.admin === 'true';
    const filter = isEditing ? {} : { status: 'published' };

    const blogs = await Blog.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name role');
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // If query is not by admin and blog is draft, deny access
    const isEditing = req.query.admin === 'true';
    if (!isEditing && blog.status === 'draft') {
      return res.status(403).json({ success: false, message: 'Access denied. This blog post is a draft.' });
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new blog post
// @route   POST /api/blogs
// @access  Private (Admin/SuperAdmin/Editor)
exports.createBlog = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a featured image' });
    }

    const { title, seoTitle, metaDescription, tags, content, status } = req.body;

    let tagsArray = [];
    if (tags) {
      tagsArray = Array.isArray(tags)
        ? tags
        : tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.path, 'sponfin/blogs');

    const blog = await Blog.create({
      title,
      seoTitle,
      metaDescription,
      tags: tagsArray,
      featuredImage: uploadResult.imageUrl,
      publicId: uploadResult.publicId,
      content,
      status: status || 'draft',
      author: req.user._id // Set from verifyToken middleware
    });

    await logActivity('Create', 'blog', `Created blog: "${blog.title}"`, req.user);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const { title, seoTitle, metaDescription, tags, content, status } = req.body;

    let tagsArray = blog.tags;
    if (tags !== undefined) {
      tagsArray = Array.isArray(tags)
        ? tags
        : tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    let updateFields = {
      title,
      seoTitle,
      metaDescription,
      tags: tagsArray,
      content,
      status: status !== undefined ? status : blog.status
    };

    // If new featured image is uploaded
    if (req.file) {
      // Delete old featured image
      await deleteImage(blog.publicId);

      // Upload new image
      const uploadResult = await uploadImage(req.file.path, 'sponfin/blogs');
      updateFields.featuredImage = uploadResult.imageUrl;
      updateFields.publicId = uploadResult.publicId;
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    await logActivity('Update', 'blog', `Updated blog: "${blog.title}" (Status: ${blog.status})`, req.user);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Delete image from Cloudinary/Local
    await deleteImage(blog.publicId);

    await Blog.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'blog', `Deleted blog: "${blog.title}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
