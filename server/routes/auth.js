const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { syncUser } = require('../controllers/authController');

// POST /api/auth/sync
// Protected route to sync logged-in Firebase user with MongoDB
router.post('/sync', authMiddleware, syncUser);

module.exports = router;
