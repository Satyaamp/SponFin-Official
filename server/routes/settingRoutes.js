const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getSettings)
  .put(
    verifyToken, 
    checkRole(['super_admin', 'admin', 'editor']), 
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'heroImage', maxCount: 1 },
      { name: 'aboutImage', maxCount: 1 }
    ]), 
    updateSettings
  );

module.exports = router;
