const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getSettings)
  .put(
    verifyToken, 
    checkPermission('settings', 'update'), 
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'heroImage', maxCount: 1 },
      { name: 'aboutImage', maxCount: 1 }
    ]), 
    updateSettings
  );

module.exports = router;
