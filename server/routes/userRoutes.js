const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkRole(['super_admin', 'admin', 'editor']), getUsers)
  .post(verifyToken, checkRole(['super_admin']), createUser);

router.route('/:id')
  .put(verifyToken, updateUser) // specific self-update logic checked in controller
  .delete(verifyToken, checkRole(['super_admin']), deleteUser);

module.exports = router;
