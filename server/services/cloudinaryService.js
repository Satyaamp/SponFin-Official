const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const uploadImage = async (filePath, folder) => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_SECRET;

  if (!isCloudinaryConfigured) {
    console.warn('WARNING: Cloudinary credentials not configured. Falling back to local file storage.');
    
    // Fallback: move file to client public uploads folder
    const publicUploadDir = path.join(__dirname, '../../client/uploads');
    if (!fs.existsSync(publicUploadDir)) {
      fs.mkdirSync(publicUploadDir, { recursive: true });
    }
    
    const filename = path.basename(filePath);
    const destPath = path.join(publicUploadDir, filename);
    
    fs.renameSync(filePath, destPath);
    
    // Return local route paths
    return {
      imageUrl: `/client/uploads/${filename}`,
      publicId: `local-${filename}`
    };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image'
    });

    // Delete local temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Even if Cloudinary fails, let's fallback to local instead of throwing error to keep it working
    try {
      const publicUploadDir = path.join(__dirname, '../../client/uploads');
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }
      const filename = path.basename(filePath);
      const destPath = path.join(publicUploadDir, filename);
      fs.renameSync(filePath, destPath);
      return {
        imageUrl: `/client/uploads/${filename}`,
        publicId: `local-${filename}`
      };
    } catch (fallbackErr) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }
};

const deleteImage = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('local-')) {
    console.log('Deleting local image:', publicId);
    const filename = publicId.replace('local-', '');
    const localFilePath = path.join(__dirname, '../../client/uploads', filename);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return { result: 'ok' };
  }

  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_SECRET;

  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary not configured. Skipping remote delete.');
    return { result: 'not_configured' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
    return null;
  }
};

module.exports = { uploadImage, deleteImage };
