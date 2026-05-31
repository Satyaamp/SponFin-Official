const Setting = require('../models/Setting');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const fs = require('fs');
const { logActivity } = require('../utils/logger');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    // If no settings exist, create default
    if (!settings) {
      settings = await Setting.create({});
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin/SuperAdmin/Editor)
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const {
      companyName,
      companyDescription,
      address,
      phone,
      email,
      socialLinks,
      heroContent,
      aboutContent
    } = req.body;

    // Parse JSON strings if they come as multipart form strings
    let parsedSocialLinks = settings.socialLinks;
    if (socialLinks) {
      parsedSocialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
    }

    let parsedHeroContent = settings.heroContent;
    if (heroContent) {
      parsedHeroContent = typeof heroContent === 'string' ? JSON.parse(heroContent) : heroContent;
    }

    let parsedAboutContent = settings.aboutContent;
    if (aboutContent) {
      parsedAboutContent = typeof aboutContent === 'string' ? JSON.parse(aboutContent) : aboutContent;
    }

    // Process file uploads
    let updatedLogo = { ...settings.logo };
    if (req.files && req.files['logo'] && req.files['logo'][0]) {
      const file = req.files['logo'][0];
      // Delete old logo if it's not the default path
      if (settings.logo && settings.logo.publicId && settings.logo.publicId !== 'sponfin_default_logo') {
        await deleteImage(settings.logo.publicId);
      }
      const uploadResult = await uploadImage(file.path, 'sponfin/settings');
      updatedLogo = {
        imageUrl: uploadResult.imageUrl,
        publicId: uploadResult.publicId
      };
    }

    if (req.files && req.files['heroImage'] && req.files['heroImage'][0]) {
      const file = req.files['heroImage'][0];
      if (settings.heroContent && settings.heroContent.publicId) {
        await deleteImage(settings.heroContent.publicId);
      }
      const uploadResult = await uploadImage(file.path, 'sponfin/settings');
      parsedHeroContent.imageUrl = uploadResult.imageUrl;
      parsedHeroContent.publicId = uploadResult.publicId;
    }

    if (req.files && req.files['aboutImage'] && req.files['aboutImage'][0]) {
      const file = req.files['aboutImage'][0];
      if (settings.aboutContent && settings.aboutContent.publicId) {
        await deleteImage(settings.aboutContent.publicId);
      }
      const uploadResult = await uploadImage(file.path, 'sponfin/settings');
      parsedAboutContent.imageUrl = uploadResult.imageUrl;
      parsedAboutContent.publicId = uploadResult.publicId;
    }

    const updateData = {
      companyName: companyName !== undefined ? companyName : settings.companyName,
      companyDescription: companyDescription !== undefined ? companyDescription : settings.companyDescription,
      address: address !== undefined ? address : settings.address,
      phone: phone !== undefined ? phone : settings.phone,
      email: email !== undefined ? email : settings.email,
      socialLinks: parsedSocialLinks,
      heroContent: parsedHeroContent,
      aboutContent: parsedAboutContent,
      logo: updatedLogo
    };

    const updatedSettings = await Setting.findByIdAndUpdate(settings._id, updateData, {
      new: true,
      runValidators: true
    });

    await logActivity('Update', 'settings', `Updated global company settings: "${updatedSettings.companyName}"`, req.user);
    res.status(200).json({ success: true, data: updatedSettings });
  } catch (error) {
    // Delete any uploaded files on failure
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const fileList = req.files[key];
        fileList.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    next(error);
  }
};
