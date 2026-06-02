const Permission = require('../models/Permission');
const { logActivity } = require('../utils/logger');

// @desc    Get all role permissions
// @route   GET /api/permissions
// @access  Private (SuperAdmin/Admin)
exports.getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find();
    res.status(200).json({ success: true, count: permissions.length, data: permissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permissions for a specific role
// @route   PUT /api/permissions/:role
// @access  Private (SuperAdmin only)
exports.updatePermission = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { moduleName, action, value } = req.body;

    if (!['admin', 'editor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Can only modify admin or editor permissions' });
    }

    if (!moduleName || !action || value === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide moduleName, action, and value' });
    }

    let perm = await Permission.findOne({ role });
    if (!perm) {
      // Create if it doesn't exist (fallback safety)
      perm = new Permission({ role });
    }

    if (!perm[moduleName]) {
      return res.status(400).json({ success: false, message: `Module ${moduleName} does not exist in schema` });
    }

    // Update field value
    perm[moduleName][action] = !!value;
    await perm.save();

    await logActivity('Update', 'permissions', `Updated ${role} permission for "${moduleName}.${action}" to ${value}`, req.user);
    
    res.status(200).json({ success: true, data: perm });
  } catch (error) {
    next(error);
  }
};
