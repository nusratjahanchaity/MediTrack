const User = require('../models/User');

// Sync Firebase Auth User with MongoDB
const syncUser = async (req, res) => {
  const { uid, email } = req.user;
  const { role } = req.body;

  try {
    let user = await User.findOne({ uid });

    if (!user) {
      // Validate requested role: only allow 'user' or 'caregiver'. Default is 'user'.
      const resolvedRole = (role === 'caregiver') ? 'caregiver' : 'user';

      user = new User({
        uid,
        email,
        role: resolvedRole
      });
      await user.save();
      console.log(`Synced new user in DB: ${email} with role: ${resolvedRole}`);
    } else {
      console.log(`User already synced: ${email}`);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error syncing user:', error.message);
    res.status(500).json({ success: false, error: 'Server error during authentication sync' });
  }
};

module.exports = {
  syncUser
};
