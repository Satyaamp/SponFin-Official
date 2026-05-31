const User = require('../models/User');
const { logActivity } = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SuperAdmin, Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (SuperAdmin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const initialRole = role || 'editor';
    const roleFromDate = new Date();
    const user = await User.create({
      name,
      email,
      password,
      role: initialRole,
      roleFromDate
    });

    // Create entry in RoleHistory collection
    const RoleHistory = require('../models/RoleHistory');
    await RoleHistory.create({
      userId: user._id,
      userName: user.name,
      role: initialRole,
      fromDate: roleFromDate,
      toDate: null,
      changedBy: req.user ? req.user.name : 'System Registration'
    });

    await logActivity('Create', 'user', `Registered user: "${user.name}" (${user.role})`, req.user);
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (SuperAdmin, Admin updating themselves)
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure permissions: super_admin can edit anyone; others can only edit their own details
    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    const { name, email, password, role, isActive } = req.body;

    // Only super_admin can change role or isActive status
    if (req.user.role !== 'super_admin') {
      if (role !== undefined && role !== user.role) {
        return res.status(403).json({ success: false, message: 'Only Super Admins can update roles' });
      }
      if (isActive !== undefined && isActive !== user.isActive) {
        return res.status(403).json({ success: false, message: 'Only Super Admins can activate/deactivate accounts' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === 'super_admin') {
      if (role !== user.role) {
        const newRoleDate = new Date();
        
        // Find previous active role history record (where toDate is null) and close it
        const RoleHistory = require('../models/RoleHistory');
        await RoleHistory.updateMany(
          { userId: user._id, toDate: null },
          { $set: { toDate: newRoleDate } }
        );

        user.role = role;
        user.roleFromDate = newRoleDate;

        // Create new active role entry in RoleHistory collection
        await RoleHistory.create({
          userId: user._id,
          userName: user.name,
          role: role,
          fromDate: newRoleDate,
          toDate: null,
          changedBy: req.user.name
        });
      }
    }
    if (isActive !== undefined && req.user.role === 'super_admin') {
      // Prevent super_admin from deactivating themselves
      if (req.user._id.toString() === req.params.id && isActive === false) {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
      }
      user.isActive = isActive;
    }

    if (password) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    await logActivity('Update', 'user', `Updated user: "${user.name}" (Role: ${user.role}, Active: ${user.isActive})`, req.user);
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.deleteOne({ _id: req.params.id });

    await logActivity('Delete', 'user', `Deleted user: "${user.name}"`, req.user);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
