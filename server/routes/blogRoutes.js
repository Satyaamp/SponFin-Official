const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getBlogs)
  .post(verifyToken, checkPermission('blogs', 'create'), upload.single('image'), createBlog);

router.route('/:id')
  .put(verifyToken, checkPermission('blogs', 'update'), upload.single('image'), updateBlog)
  .delete(verifyToken, checkPermission('blogs', 'delete'), deleteBlog);

// GET blog by slug
router.get('/:slug', getBlogBySlug);

module.exports = router;
