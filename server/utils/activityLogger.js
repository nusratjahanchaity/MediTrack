const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an activity to the database.
 * 
 * @param {Object} params
 * @param {string} params.userId - Target patient's UID.
 * @param {string} params.action - Action string (e.g. 'ADD_MEDICINE').
 * @param {string} params.description - Human readable text details.
 * @param {Object} params.req - Express request object containing performer details in req.user.
 */
const logActivity = async ({ userId, action, description, req }) => {
  try {
    if (!req || !req.user || !req.user.uid) {
      console.warn('Cannot log activity: request performer info is missing');
      return;
    }

    const performerUid = req.user.uid;
    const performerEmail = req.user.email;
    
    // Lookup performer's role in database (default to 'user')
    let performerRole = 'user';
    const performerUser = await User.findOne({ uid: performerUid });
    if (performerUser) {
      performerRole = performerUser.role;
    }

    const log = new ActivityLog({
      userId,
      action,
      description,
      performedBy: performerUid,
      performedByEmail: performerEmail,
      performedByRole: performerRole
    });

    await log.save();
    console.log(`Activity logged: [${action}] for user ${userId} by ${performerEmail}`);
  } catch (error) {
    console.error('Error logging activity:', error.message);
  }
};

module.exports = { logActivity };
