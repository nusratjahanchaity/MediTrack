const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMe,
  getPatients,
  getCaregivers,
  getAssignedPatients,
  assignCaregiver,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', getMe);

// GET /api/users/patients (Admin only)
router.get('/patients', getPatients);

// GET /api/users/caregivers (Admin only)
router.get('/caregivers', getCaregivers);

// GET /api/users/assigned (Caregiver/Admin only)
router.get('/assigned', getAssignedPatients);

// POST /api/users/assign (Admin only)
router.post('/assign', assignCaregiver);

// PUT /api/users/:uid (Admin only)
router.put('/:uid', updateUser);

// DELETE /api/users/:uid (Admin only)
router.delete('/:uid', deleteUser);

module.exports = router;
