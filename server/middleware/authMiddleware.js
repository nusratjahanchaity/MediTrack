const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized with service account key.');
  } catch (error) {
    console.error('Failed to load service account JSON, initializing with project ID fallback:', error.message);
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'meditrack-24e13'
    });
  }
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token looks like a JWT (has 3 parts separated by dots)
    const isJWT = token.split('.').length === 3;

    if (isJWT) {
      // Real Firebase ID Token verification
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email
      };
      return next();
    } else {
      // Local Development Bypass: treat raw string as the UID directly
      console.log('Received raw token, falling back to local dev user sync:', token);
      req.user = {
        uid: token,
        email: `${token}@dev.meditrack.local`
      };
      return next();
    }
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ message: 'Token verification failed', error: error.message });
  }
};

module.exports = authMiddleware;
