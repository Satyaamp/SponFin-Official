const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getServices)
  .post(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.single('image'), createService);

router.route('/:id')
  .get(getService)
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.single('image'), updateService)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteService);

module.exports = router;
