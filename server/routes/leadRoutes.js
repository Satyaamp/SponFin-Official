const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  updateLead,
  deleteLead
} = require('../controllers/leadController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .post(createLead)
  .get(verifyToken, checkRole(['super_admin', 'admin', 'editor']), getLeads);

router.route('/:id')
  .put(verifyToken, checkRole(['super_admin', 'admin', 'editor']), updateLead)
  .delete(verifyToken, checkRole(['super_admin', 'admin']), deleteLead);

module.exports = router;
