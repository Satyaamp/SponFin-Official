const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// @desc    Get all system activity logs
// @route   GET /api/logs
// @access  Private (SuperAdmin only)
router.get('/', verifyToken, checkRole(['super_admin']), async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const query = {};
    let limitValue = 100; // default limit to avoid loading too many logs
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
        limitValue = 0;
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
        limitValue = 0;
      }
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(limitValue);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
