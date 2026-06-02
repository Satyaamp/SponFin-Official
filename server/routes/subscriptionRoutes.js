const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSubscriptions)
  .post(verifyToken, checkRole(['super_admin', 'admin', 'editor']), createSubscription);

router.route('/:id')
  .get(getSubscription)
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), updateSubscription)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteSubscription);

module.exports = router;
