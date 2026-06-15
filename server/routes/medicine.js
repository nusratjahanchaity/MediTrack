const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMedicines,
  addMedicine,
  toggleMedicineTaken,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');

// All medicine routes require authentication
router.use(authMiddleware);

// GET /api/medicines & POST /api/medicines
router.route('/')
  .get(getMedicines)
  .post(addMedicine);

// PATCH /api/medicines/:id/toggle
router.patch('/:id/toggle', toggleMedicineTaken);

// PUT /api/medicines/:id & DELETE /api/medicines/:id
router.route('/:id')
  .put(updateMedicine)
  .delete(deleteMedicine);

module.exports = router;
