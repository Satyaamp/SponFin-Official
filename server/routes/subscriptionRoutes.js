const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSubscriptions)
  .post(verifyToken, checkPermission('subscriptions', 'create'), createSubscription);

router.route('/:id')
  .get(getSubscription)
  .put(verifyToken, checkPermission('subscriptions', 'update'), updateSubscription)
  .delete(verifyToken, checkPermission('subscriptions', 'delete'), deleteSubscription);

module.exports = router;
