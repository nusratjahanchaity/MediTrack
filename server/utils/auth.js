const User = require('../models/User');

/**
 * Checks if an operator (logged-in user) is authorized to act on behalf of a target user.
 * Authorized if:
 * 1. The operator is the target user themselves (operator.uid === targetUid).
 * 2. The operator is an Admin (role === 'admin').
 * 3. The operator is a Caregiver (role === 'caregiver') and the target user is assigned to them (targetUser.caregiverUid === operator.uid).
 */
const checkUserAccess = async (operator, targetUid) => {
  if (!operator || !operator.uid) return false;
  if (!targetUid) return false;

  // Case 1: Operating on own profile
  if (operator.uid === targetUid) {
    return true;
  }

  try {
    // Fetch operator user details
    const dbOperator = await User.findOne({ uid: operator.uid });
    if (!dbOperator) return false;

    // Case 2: Operator is Admin
    if (dbOperator.role === 'admin') {
      return true;
    }

    // Case 3: Operator is Caregiver
    if (dbOperator.role === 'caregiver') {
      const targetUser = await User.findOne({ uid: targetUid });
      if (targetUser && targetUser.caregiverUid === operator.uid) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking user access:', error.message);
  }

  return false;
};

module.exports = {
  checkUserAccess
};
