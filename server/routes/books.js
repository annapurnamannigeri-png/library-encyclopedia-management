const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/barcode/:barcode', bookController.getBookByBarcode);
router.get('/', bookController.getBooks);
router.post('/', verifyToken, isAdmin, bookController.addBook);
router.put('/:id', verifyToken, isAdmin, bookController.updateBook);
router.delete('/:id', verifyToken, isAdmin, bookController.deleteBook);

module.exports = router;
