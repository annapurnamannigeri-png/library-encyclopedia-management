const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { verifyToken } = require('../middleware/auth');

router.post('/issue', verifyToken, issueController.issueBook);
router.post('/return', verifyToken, issueController.returnBook);
router.get('/history', verifyToken, issueController.getUserHistory);
router.post('/request-fine-waiver', verifyToken, issueController.submitFineRequest);
router.post('/barcode-issue', verifyToken, issueController.issueBookByBarcode);
router.post('/barcode-return', verifyToken, issueController.returnBookByBarcode);

module.exports = router;
