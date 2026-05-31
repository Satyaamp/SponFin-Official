const Project = require('../models/Project');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const fs = require('fs');
const { logActivity } = require('../utils/logger');

// @desc    Get all projects (with optional category filter)
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (featured === 'true') {
      query.featured = true;
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
exports.getProjectBySlug = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/SuperAdmin/Editor)
exports.createProject = async (req, res, next) => {
  try {
    const { title, category, description, technologies, projectUrl, featured } = req.body;
    
    // Parse technologies (comma-separated or array)
    let techArray = [];
    if (technologies) {
      techArray = Array.isArray(technologies) 
        ? technologies 
        : technologies.split(',').map(tech => tech.trim()).filter(Boolean);
    }

    // Upload files if present
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.path, 'sponfin/projects');
        images.push({
          imageUrl: uploadResult.imageUrl,
          publicId: uploadResult.publicId
        });
      }
    }

    const project = await Project.create({
      title,
      category,
      description,
      technologies: techArray,
      images,
      projectUrl,
      featured: featured === 'true' || featured === true
    });

    await logActivity('Create', 'project', `Created project: "${project.title}"`, req.user);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    // Cleanup any uploaded temp files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { title, category, description, technologies, projectUrl, featured, deletedPublicIds } = req.body;

    let techArray = project.technologies;
    if (technologies !== undefined) {
      techArray = Array.isArray(technologies) 
        ? technologies 
        : technologies.split(',').map(tech => tech.trim()).filter(Boolean);
    }

    // Handle existing images deletion
    let currentImages = [...project.images];
    if (deletedPublicIds) {
      const toDelete = Array.isArray(deletedPublicIds) ? deletedPublicIds : [deletedPublicIds];
      for (const pid of toDelete) {
        await deleteImage(pid);
        currentImages = currentImages.filter(img => img.publicId !== pid);
      }
    }

    // Upload new files and append to list
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.path, 'sponfin/projects');
        currentImages.push({
          imageUrl: uploadResult.imageUrl,
          publicId: uploadResult.publicId
        });
      }
    }

    const updateFields = {
      title,
      category,
      description,
      technologies: techArray,
      images: currentImages,
      projectUrl,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : project.featured
    };

    project = await Project.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    await logActivity('Update', 'project', `Updated project: "${project.title}"`, req.user);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete all images associated with project
    for (const image of project.images) {
      await deleteImage(image.publicId);
    }

    await Project.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'project', `Deleted project: "${project.title}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
