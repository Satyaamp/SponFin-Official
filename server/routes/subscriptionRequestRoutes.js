const express = require('express');
const router = express.Router();
const {
  createSubscriptionRequest,
  getSubscriptionRequests,
  updateSubscriptionRequest,
  deleteSubscriptionRequest
} = require('../controllers/subscriptionRequestController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
  .post(createSubscriptionRequest)
  .get(verifyToken, checkPermission('subscriptionRequests', 'read'), getSubscriptionRequests);

router.route('/:id')
  .put(verifyToken, checkPermission('subscriptionRequests', 'update'), updateSubscriptionRequest)
  .delete(verifyToken, checkPermission('subscriptionRequests', 'delete'), deleteSubscriptionRequest);

module.exports = router;
