const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// 1. Load service account
const serviceAccount = require(path.join(process.cwd(), 'service-account.json'));

// 2. Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'campus48-e8356'
  });
  console.log('✅ Firebase Admin initialized. Project: campus48-e8356');
}

// 3. Firestore access (default database)
const getFirestoreDb = () => admin.firestore();

const runFirestoreOp = async (op) => {
  try {
    const db = getFirestoreDb();
    return await op(db);
  } catch (error) {
    console.error(`❌ Firestore Error: [${error.code}] ${error.message}`);
    throw error;
  }
};

module.exports = {
  admin,
  getFirestoreDb,
  runFirestoreOp,
  get firestore() { return getFirestoreDb(); }
};