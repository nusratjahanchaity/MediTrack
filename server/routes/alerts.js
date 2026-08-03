const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Alert = require('../models/Alert');
const User = require('../models/User');

// All alert routes require auth
router.use(authMiddleware);

// GET /api/alerts
// Returns unresolved alerts for caregiver's patients or all alerts for admin
router.get('/', async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || (currentUser.role !== 'caregiver' && currentUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied: Caregivers and Admins only' });
    }

    let query = { isResolved: false };

    if (currentUser.role === 'caregiver') {
      // Find all patients assigned to this caregiver
      const patients = await User.find({ caregiverUid: req.user.uid }).select('uid');
      const patientUids = patients.map(p => p.uid);
      query.userId = { $in: patientUids };
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error.message);
    res.status(500).json({ message: 'Server error retrieving alerts' });
  }
});

// PATCH /api/alerts/:id/resolve
// Marks a specific alert as resolved/dismissed
router.patch('/:id/resolve', async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || (currentUser.role !== 'caregiver' && currentUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied: Caregivers and Admins only' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Caregivers can only resolve alerts of their assigned patients
    if (currentUser.role === 'caregiver') {
      const patient = await User.findOne({ uid: alert.userId });
      if (!patient || patient.caregiverUid !== req.user.uid) {
        return res.status(403).json({ message: 'Access denied: Unauthorized to resolve alert for this patient' });
      }
    }

    alert.isResolved = true;
    await alert.save();

    res.json({ success: true, message: 'Alert resolved successfully', alert });
  } catch (error) {
    console.error('Error resolving alert:', error.message);
    res.status(500).json({ message: 'Server error resolving alert' });
  }
});

module.exports = router;
