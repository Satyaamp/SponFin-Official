const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getProjects)
  .post(verifyToken, checkPermission('projects', 'create'), upload.array('images', 10), createProject);

router.route('/:id')
  .put(verifyToken, checkPermission('projects', 'update'), upload.array('images', 10), updateProject)
  .delete(verifyToken, checkPermission('projects', 'delete'), deleteProject);

// GET project by slug
router.get('/:slug', getProjectBySlug);

module.exports = router;
