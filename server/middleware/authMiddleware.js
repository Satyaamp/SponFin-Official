const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  let token;

  // Check header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction');

    // Get user from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Attach user context to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Middleware to check roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized to access this resource` 
      });
    }

    next();
  };
};

const Permission = require('../models/Permission');

// Middleware to check dynamic database-stored role permissions
const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Super Admin has all rights by default
    if (req.user.role === 'super_admin') {
      return next();
    }

    try {
      const perm = await Permission.findOne({ role: req.user.role });
      if (!perm) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied: No permissions configured for role '${req.user.role}'` 
        });
      }

      const modulePermissions = perm[moduleName];
      if (modulePermissions && modulePermissions[action] === true) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: `Access denied: You do not have permission to ${action} ${moduleName}` 
      });
    } catch (err) {
      console.error('Permission check error:', err);
      return res.status(500).json({ success: false, message: 'Server error checking permissions' });
    }
  };
};

module.exports = { verifyToken, checkRole, checkPermission };
