const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken } = require('../middleware/auth');

router.post('/reserve', verifyToken, reservationController.reserveBook);
router.get('/my-reservations', verifyToken, reservationController.getUserReservations);
router.delete('/cancel/:id', verifyToken, reservationController.cancelReservation);

module.exports = router;
