const User = require('../models/User');

// Sync Firebase Auth User with MongoDB
const syncUser = async (req, res) => {
  const { uid, email } = req.user;

  try {
    let user = await User.findOne({ uid });

    if (!user) {
      user = new User({
        uid,
        email
      });
      await user.save();
      console.log(`Synced new user in DB: ${email}`);
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
