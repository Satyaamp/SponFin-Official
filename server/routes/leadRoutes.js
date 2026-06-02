const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  updateLead,
  deleteLead
} = require('../controllers/leadController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
  .post(createLead)
  .get(verifyToken, checkPermission('leads', 'read'), getLeads);

router.route('/:id')
  .put(verifyToken, checkPermission('leads', 'update'), updateLead)
  .delete(verifyToken, checkPermission('leads', 'delete'), deleteLead);

module.exports = router;
