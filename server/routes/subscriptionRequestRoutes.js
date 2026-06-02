const express = require('express');
const router = express.Router();
const {
  createSubscriptionRequest,
  getSubscriptionRequests,
  updateSubscriptionRequest,
  deleteSubscriptionRequest
} = require('../controllers/subscriptionRequestController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .post(createSubscriptionRequest)
  .get(verifyToken, checkRole(['super_admin', 'admin', 'editor']), getSubscriptionRequests);

router.route('/:id')
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), updateSubscriptionRequest)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteSubscriptionRequest);

module.exports = router;
