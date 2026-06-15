const Medicine = require('../models/Medicine');

// @desc Get all medicines for current user
// @route GET /api/medicines
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error.message);
    res.status(500).json({ message: 'Server error fetching medicines' });
  }
};

// @desc Add new medicine
// @route POST /api/medicines
const addMedicine = async (req, res) => {
  const { name, dosage, time, type, color } = req.body;

  if (!name || !dosage || !time) {
    return res.status(400).json({ message: 'Please provide name, dosage, and time' });
  }

  try {
    const newMedicine = new Medicine({
      userId: req.user.uid,
      name,
      dosage,
      time,
      type,
      color,
      taken: false
    });

    const savedMedicine = await newMedicine.save();
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
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user.uid });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found or unauthorized' });
    }

    medicine.taken = !medicine.taken;
    await medicine.save();

    res.json(medicine);
  } catch (error) {
    console.error('Error toggling medicine status:', error.message);
    res.status(500).json({ message: 'Server error updating medicine status' });
  }
};

// @desc Update medicine details
// @route PUT /api/medicines/:id
const updateMedicine = async (req, res) => {
  const { name, dosage, time, type, color } = req.body;

  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user.uid });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found or unauthorized' });
    }

    if (name) medicine.name = name;
    if (dosage) medicine.dosage = dosage;
    if (time) medicine.time = time;
    if (type) medicine.type = type;
    if (color) medicine.color = color;

    const updatedMedicine = await medicine.save();
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
    const result = await Medicine.deleteOne({ _id: req.params.id, userId: req.user.uid });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Medicine not found or unauthorized' });
    }

    res.json({ message: 'Medicine deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting medicine:', error.message);
    res.status(500).json({ message: 'Server error deleting medicine' });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  toggleMedicineTaken,
  updateMedicine,
  deleteMedicine
};
