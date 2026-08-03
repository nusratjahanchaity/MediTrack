const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get current user profile & role
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    let caregiver = null;
    if (user.caregiverUid) {
      caregiver = await User.findOne({ uid: user.caregiverUid }).select('uid email');
    }

    const name = user.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    res.json({
      uid: user.uid,
      email: user.email,
      name,
      role: user.role,
      caregiverUid: user.caregiverUid,
      caregiver
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// @desc    Get all regular users/patients (Admin only)
// @route   GET /api/users/patients
// @access  Private (Admin)
const getPatients = async (req, res) => {
  try {
    // Verify admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const patients = await User.find({ role: 'user' });
    
    // Enrich with caregiver email/info
    const enrichedPatients = await Promise.all(patients.map(async (patient) => {
      let caregiver = null;
      if (patient.caregiverUid) {
        caregiver = await User.findOne({ uid: patient.caregiverUid }).select('uid email');
      }
      return {
        _id: patient._id,
        uid: patient.uid,
        email: patient.email,
        role: patient.role,
        caregiverUid: patient.caregiverUid,
        caregiverEmail: caregiver ? caregiver.email : null,
        createdAt: patient.createdAt
      };
    }));

    res.json(enrichedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    res.status(500).json({ message: 'Server error retrieving patients list' });
  }
};

// @desc    Get all caregivers (Admin only)
// @route   GET /api/users/caregivers
// @access  Private (Admin)
const getCaregivers = async (req, res) => {
  try {
    // Verify admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const caregivers = await User.find({ role: 'caregiver' }).select('uid email role createdAt');
    res.json(caregivers);
  } catch (error) {
    console.error('Error fetching caregivers:', error.message);
    res.status(500).json({ message: 'Server error retrieving caregivers list' });
  }
};

// @desc    Get patients assigned to logged-in caregiver (Caregiver only)
// @route   GET /api/users/assigned
// @access  Private (Caregiver)
const getAssignedPatients = async (req, res) => {
  try {
    // Verify caregiver
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || (currentUser.role !== 'caregiver' && currentUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied: Caregivers/Admins only' });
    }

    let query = { caregiverUid: req.user.uid };
    // If admin is requesting, let them get all users so they can choose to view any profile
    if (currentUser.role === 'admin') {
      query = { role: 'user' };
    }

    const patients = await User.find(query).select('uid email role caregiverUid createdAt');
    res.json(patients);
  } catch (error) {
    console.error('Error fetching assigned patients:', error.message);
    res.status(500).json({ message: 'Server error retrieving assigned patients' });
  }
};

// @desc    Assign caregiver to a user (Admin only)
// @route   POST /api/users/assign
// @access  Private (Admin)
const assignCaregiver = async (req, res) => {
  const { patientUid, caregiverUid } = req.body;

  if (!patientUid) {
    return res.status(400).json({ message: 'patientUid is required' });
  }

  try {
    // Verify admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    // Verify patient exists
    const patient = await User.findOne({ uid: patientUid });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify caregiver exists and is a caregiver (if caregiverUid is provided)
    if (caregiverUid) {
      const caregiver = await User.findOne({ uid: caregiverUid });
      if (!caregiver) {
        return res.status(404).json({ message: 'Caregiver not found' });
      }
      if (caregiver.role !== 'caregiver') {
        return res.status(400).json({ message: 'User specified is not a caregiver' });
      }
    }

    patient.caregiverUid = caregiverUid || null;
    await patient.save();

    let caregiverEmail = 'None';
    if (caregiverUid) {
      const caregiverObj = await User.findOne({ uid: caregiverUid });
      if (caregiverObj) {
        caregiverEmail = caregiverObj.email;
      }
    }

    await logActivity({
      userId: patientUid,
      action: 'ASSIGN_CAREGIVER',
      description: caregiverUid ? `Caregiver "${caregiverEmail}" assigned to patient` : 'Caregiver removed from patient',
      req
    });

    console.log(`Caregiver ${caregiverUid || 'none'} assigned to user ${patient.email}`);
    res.json({ success: true, message: 'Caregiver assignment updated successfully', patient });
  } catch (error) {
    console.error('Error assigning caregiver:', error.message);
    res.status(500).json({ message: 'Server error during caregiver assignment' });
  }
};

// @desc    Update user or caregiver info (Admin only)
// @route   PUT /api/users/:uid
// @access  Private (Admin)
const updateUser = async (req, res) => {
  const { email, role } = req.body;
  const { uid } = req.params;

  try {
    // Verify admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const targetUser = await User.findOne({ uid });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) targetUser.email = email;
    if (role && ['user', 'caregiver', 'admin'].includes(role)) {
      targetUser.role = role;
    }

    await targetUser.save();

    await logActivity({
      userId: targetUser.uid,
      action: 'UPDATE_USER',
      description: `Updated user profile (Email: ${targetUser.email}, Role: ${targetUser.role})`,
      req
    });

    console.log(`User ${targetUser.email} updated by admin`);
    res.json({ success: true, message: 'User details updated successfully', user: targetUser });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Server error updating user details' });
  }
};

// @desc    Delete user or caregiver account (Admin only)
// @route   DELETE /api/users/:uid
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  const { uid } = req.params;

  try {
    // Verify admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const targetUser = await User.findOne({ uid });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated medicines and prescriptions
    const Medicine = require('../models/Medicine');
    const Prescription = require('../models/Prescription');

    await Medicine.deleteMany({ userId: uid });
    
    // Cleanup physical files for prescriptions before deletion
    const prescriptions = await Prescription.find({ userId: uid });
    const fs = require('fs');
    const path = require('path');
    for (const pres of prescriptions) {
      const filePath = path.join(__dirname, '..', 'uploads', pres.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting prescription file during user deletion:', err);
        });
      }
    }
    await Prescription.deleteMany({ userId: uid });

    // If deleting a caregiver, unassign them from any patients
    if (targetUser.role === 'caregiver') {
      await User.updateMany({ caregiverUid: uid }, { caregiverUid: null });
    }

    // Delete target user's activity logs
    await ActivityLog.deleteMany({ userId: uid });

    // Delete the user record
    await User.deleteOne({ uid });

    console.log(`User ${targetUser.email} and all data deleted by admin`);
    res.json({ success: true, message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

module.exports = {
  getMe,
  getPatients,
  getCaregivers,
  getAssignedPatients,
  assignCaregiver,
  updateUser,
  deleteUser
};
