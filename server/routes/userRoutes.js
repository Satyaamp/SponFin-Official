const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkPermission('users', 'read'), getUsers)
  .post(verifyToken, checkPermission('users', 'create'), createUser);

router.route('/:id')
  .put(verifyToken, updateUser) // self-service details update checks inside controller
  .delete(verifyToken, checkPermission('users', 'delete'), deleteUser);

module.exports = router;
