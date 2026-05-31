const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getProjects)
  .post(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.array('images', 10), createProject);

router.route('/:id')
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.array('images', 10), updateProject)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteProject);

// GET project by slug
router.get('/:slug', getProjectBySlug);

module.exports = router;
