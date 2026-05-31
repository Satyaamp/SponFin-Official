const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getBlogs)
  .post(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.single('image'), createBlog);

router.route('/:id')
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), upload.single('image'), updateBlog)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteBlog);

// GET blog by slug
router.get('/:slug', getBlogBySlug);

module.exports = router;
