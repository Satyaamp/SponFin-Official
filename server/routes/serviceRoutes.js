const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getServices)
  .post(verifyToken, checkPermission('services', 'create'), upload.single('image'), createService);

router.route('/:id')
  .get(getService)
  .put(verifyToken, checkPermission('services', 'update'), upload.single('image'), updateService)
  .delete(verifyToken, checkPermission('services', 'delete'), deleteService);

module.exports = router;
