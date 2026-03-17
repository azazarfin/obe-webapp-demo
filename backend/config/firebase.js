const admin = require('firebase-admin');

// We expect FIREBASE_SERVICE_ACCOUNT to be stored as a base64 encoded JSON string in .env
// Or handled via standard GCP/Firebase credential methods.
// For robust development, we can initialize it if custom credentials are provided,
// or use application default credentials.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin with provided credentials.', error);
  }
} else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
       projectId: process.env.FIREBASE_PROJECT_ID
    });
} else {
  admin.initializeApp();
}

module.exports = admin;
