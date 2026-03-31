const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// 1. Load centralized configuration
let firebaseConfig = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Firebase configuration loaded from root in lib/firebase-admin.js');
  } else {
    throw new Error('firebase-applet-config.json not found in root.');
  }
} catch (err) {
  console.error('❌ CRITICAL: Error loading firebase-applet-config.json:', err.message);
  // We cannot proceed without config
  process.exit(1);
}

// 2. Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const projectId = firebaseConfig.projectId;
    
    console.log('📡 Initializing Firebase Admin with Project ID:', projectId);
    
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId
    });
    
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (err) {
    console.error('❌ CRITICAL: Error initializing Firebase Admin:', err.message);
    process.exit(1);
  }
}

// 3. Centralized Firestore Database Access
const getFirestoreDb = () => {
  const dbId = firebaseConfig.firestoreDatabaseId;
  
  if (dbId && dbId !== '(default)') {
    try {
      console.log(`📡 Accessing named Firestore database: ${dbId}`);
      return getFirestore(admin.app(), dbId);
    } catch (e) {
      console.error(`❌ Error accessing named database ${dbId}:`, e.message);
      throw e;
    }
  }
  
  console.log('📡 Accessing default Firestore database');
  return admin.firestore();
};

/**
 * Executes a Firestore operation with centralized error handling and logging.
 */
const runFirestoreOp = async (op) => {
  try {
    const db = getFirestoreDb();
    return await op(db);
  } catch (error) {
    const errorMsg = error.message || String(error);
    const errorCode = error.code;
    
    console.error(`❌ Firestore Operation Error: [${errorCode}] ${errorMsg}`);
    
    if (errorCode === 5 || errorMsg.includes('NOT_FOUND')) {
      console.error('🚨 DATABASE NOT FOUND. Please verify your firestoreDatabaseId in firebase-applet-config.json');
    }
    
    throw error;
  }
};

module.exports = {
  admin,
  getFirestoreDb,
  runFirestoreOp,
  get firestore() { return getFirestoreDb(); }
};
