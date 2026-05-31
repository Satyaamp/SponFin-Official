const ActivityLog = require('../models/ActivityLog');

/**
 * Log a system activity/audit record.
 * @param {string} action - 'Create', 'Update', 'Delete', etc.
 * @param {string} module - 'service', 'project', 'blog', 'lead', 'settings', 'user'.
 * @param {string} details - Detailed descriptive message of the action.
 * @param {object} user - The user object executing the request (from req.user).
 */
const logActivity = async (action, module, details, user) => {
  try {
    if (!user) {
      console.warn('Attempted to log activity without user context.');
      return;
    }
    await ActivityLog.create({
      action,
      module,
      details,
      performedBy: user.name || user.email,
      performedByRole: user.role
    });
  } catch (error) {
    console.error('Failed to write activity log:', error.message);
  }
};

module.exports = { logActivity };
