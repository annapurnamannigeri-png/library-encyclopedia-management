const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/stats', verifyToken, isAdmin, adminController.getDashboardStats);
router.get('/issues', verifyToken, isAdmin, adminController.getAllIssues);
router.get('/requests', verifyToken, isAdmin, adminController.getFineRequests);
router.put('/request/:id', verifyToken, isAdmin, adminController.handleFineRequest);
router.get('/users/usn/:usn', verifyToken, isAdmin, adminController.getUserByUSN);
router.get('/added-books', verifyToken, isAdmin, adminController.getAdminAddedBooks);

module.exports = router;
