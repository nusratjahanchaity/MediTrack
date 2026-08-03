const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ActivityLog = require('../models/ActivityLog');
const { checkUserAccess } = require('../utils/auth');

// GET /api/history
// Returns activity history logs for the given userId (defaults to logged-in user)
router.get('/', authMiddleware, async (req, res) => {
  const targetUid = req.query.userId || req.user.uid;

  try {
    // Check if the operator is authorized to view this user's data
    if (!await checkUserAccess(req.user, targetUid)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to view history for this user' });
    }

    const logs = await ActivityLog.find({ userId: targetUid }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching history:', error.message);
    res.status(500).json({ message: 'Server error retrieving history' });
  }
});

module.exports = router;
