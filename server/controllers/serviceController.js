const Service = require('../models/Service');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const fs = require('fs');
const { logActivity } = require('../utils/logger');

// @desc    Get all services
// @route   GET /api/services
// @access  Public (returns active only) / Admin (returns all if queried)
exports.getServices = async (req, res, next) => {
  try {
    const isEditing = req.query.admin === 'true';
    const filter = isEditing ? {} : { isActive: true };
    
    const services = await Service.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin/SuperAdmin/Editor)
exports.createService = async (req, res, next) => {
  try {
    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image for the service' });
    }

    const { title, shortDescription, description, displayOrder, isActive } = req.body;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.path, 'sponfin/services');

    const service = await Service.create({
      title,
      shortDescription,
      description,
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive === 'true' || isActive === true,
      imageUrl: uploadResult.imageUrl,
      publicId: uploadResult.publicId
    });

    await logActivity('Create', 'service', `Created service: "${service.title}"`, req.user);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    // Delete local temp file if still exists after error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { title, shortDescription, description, displayOrder, isActive } = req.body;
    let updateFields = {
      title,
      shortDescription,
      description,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : service.displayOrder,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : service.isActive
    };

    // If new image is uploaded
    if (req.file) {
      // Delete old image
      await deleteImage(service.publicId);

      // Upload new image
      const uploadResult = await uploadImage(req.file.path, 'sponfin/services');
      updateFields.imageUrl = uploadResult.imageUrl;
      updateFields.publicId = uploadResult.publicId;
    }

    service = await Service.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    await logActivity('Update', 'service', `Updated service: "${service.title}"`, req.user);
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    // Delete local temp file if still exists after error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin/SuperAdmin/Editor)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Delete image from Cloudinary/Local
    await deleteImage(service.publicId);

    // Delete record from database
    await Service.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'service', `Deleted service: "${service.title}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
