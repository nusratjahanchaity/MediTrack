const Medicine = require('../models/Medicine');
const { checkUserAccess } = require('../utils/auth');
const { logActivity } = require('../utils/activityLogger');

// @desc Get all medicines for current user or assigned user
// @route GET /api/medicines
const getMedicines = async (req, res) => {
  const targetUid = req.query.userId || req.user.uid;

  try {
    if (!await checkUserAccess(req.user, targetUid)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to view medications for this user' });
    }

    const medicines = await Medicine.find({ userId: targetUid }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error.message);
    res.status(500).json({ message: 'Server error fetching medicines' });
  }
};

// @desc Add new medicine
// @route POST /api/medicines
const addMedicine = async (req, res) => {
  const { name, dosage, time, type, color, comment, userId } = req.body;
  const targetUid = userId || req.user.uid;

  if (!name || !dosage || !time) {
    return res.status(400).json({ message: 'Please provide name, dosage, and time' });
  }

  try {
    if (!await checkUserAccess(req.user, targetUid)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to add medications for this user' });
    }

    const newMedicine = new Medicine({
      userId: targetUid,
      name,
      dosage,
      time,
      type,
      color,
      comment: comment || '',
      taken: false
    });

    const savedMedicine = await newMedicine.save();
    await logActivity({
      userId: targetUid,
      action: 'ADD_MEDICINE',
      description: `Added medication "${name}" (Dosage: ${dosage}, Time: ${time})`,
      req
    });
    res.status(201).json(savedMedicine);
  } catch (error) {
    console.error('Error saving medicine:', error.message);
    res.status(500).json({ message: 'Server error saving medicine' });
  }
};

// @desc Toggle medicine taken status
// @route PATCH /api/medicines/:id/toggle
const toggleMedicineTaken = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (!await checkUserAccess(req.user, medicine.userId)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to update this medication' });
    }

    medicine.taken = !medicine.taken;
    await medicine.save();

    if (medicine.taken) {
      const Alert = require('../models/Alert');
      await Alert.updateMany({ medicineId: medicine._id, isResolved: false }, { isResolved: true });
    }

    await logActivity({
      userId: medicine.userId,
      action: 'TOGGLE_MEDICINE',
      description: `Marked medication "${medicine.name}" as ${medicine.taken ? 'taken' : 'not taken'}`,
      req
    });

    res.json(medicine);
  } catch (error) {
    console.error('Error toggling medicine status:', error.message);
    res.status(500).json({ message: 'Server error updating medicine status' });
  }
};

// @desc Update medicine details
// @route PUT /api/medicines/:id
const updateMedicine = async (req, res) => {
  const { name, dosage, time, type, color, comment } = req.body;

  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (!await checkUserAccess(req.user, medicine.userId)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to update this medication' });
    }

    if (name) medicine.name = name;
    if (dosage) medicine.dosage = dosage;
    if (time) medicine.time = time;
    if (type) medicine.type = type;
    if (color) medicine.color = color;
    if (comment !== undefined) medicine.comment = comment;

    const updatedMedicine = await medicine.save();
    await logActivity({
      userId: medicine.userId,
      action: 'UPDATE_MEDICINE',
      description: `Updated medication "${medicine.name}" details`,
      req
    });
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Error updating medicine:', error.message);
    res.status(500).json({ message: 'Server error updating medicine' });
  }
};

// @desc Delete medicine
// @route DELETE /api/medicines/:id
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (!await checkUserAccess(req.user, medicine.userId)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to delete this medication' });
    }

    const medName = medicine.name;
    const medUserId = medicine.userId;
    await Medicine.deleteOne({ _id: req.params.id });

    const Alert = require('../models/Alert');
    const Notification = require('../models/Notification');
    await Alert.deleteMany({ medicineId: req.params.id });
    await Notification.deleteMany({ medicineId: req.params.id });

    await logActivity({
      userId: medUserId,
      action: 'DELETE_MEDICINE',
      description: `Deleted medication "${medName}"`,
      req
    });

    res.json({ message: 'Medicine deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting medicine:', error.message);
    res.status(500).json({ message: 'Server error deleting medicine' });
  }
};

// @desc Bulk add medicines
// @route POST /api/medicines/bulk
const bulkAddMedicines = async (req, res) => {
  const { medicines, userId } = req.body;
  const targetUid = userId || req.user.uid;

  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of medicines' });
  }

  try {
    if (!await checkUserAccess(req.user, targetUid)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to add medications for this user' });
    }

    const medicinesToInsert = medicines.map(med => ({
      userId: targetUid,
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      type: med.type || 'Tablet',
      color: med.color || '#3B82F6',
      comment: med.comment || '',
      taken: false
    }));

    const savedMedicines = await Medicine.insertMany(medicinesToInsert);
    await logActivity({
      userId: targetUid,
      action: 'BULK_ADD_MEDICINES',
      description: `Bulk added ${savedMedicines.length} medications from prescription`,
      req
    });
    res.status(201).json(savedMedicines);
  } catch (error) {
    console.error('Error bulk saving medicines:', error.message);
    res.status(500).json({ message: 'Server error bulk saving medicines' });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  toggleMedicineTaken,
  updateMedicine,
  deleteMedicine,
  bulkAddMedicines
};
