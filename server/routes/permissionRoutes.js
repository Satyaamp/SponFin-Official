const express = require('express');
const router = express.Router();
const { getPermissions, updatePermission } = require('../controllers/permissionController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkRole(['super_admin', 'admin', 'editor']), getPermissions);

router.route('/:role')
  .put(verifyToken, checkRole(['super_admin']), updatePermission);

module.exports = router;
