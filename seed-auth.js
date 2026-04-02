/**
 * seed-auth.js — Crea los usuarios en Firebase Authentication
 * Corre DESPUÉS de seed.js: node seed-auth.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'campus48-e8356'
  });
}

const db = admin.firestore();

const USERS = [
  { uid: 'director_morales',  email: 'director.morales@campus48.local', password: 'campus48pass', name: 'Roberto Morales' },
  { uid: 'teacher_garcia',    email: 'garcia@campus48.local',            password: 'campus48pass', name: 'Ana García' },
  { uid: 'teacher_lopez',     email: 'lopez@campus48.local',             password: 'campus48pass', name: 'Carlos López' },
  { uid: 'student_perez',     email: 'lucia.perez@campus48.local',       password: 'campus48pass', name: 'Lucía Pérez' },
  { uid: 'student_gonzalez',  email: 'mateo.gonzalez@campus48.local',    password: 'campus48pass', name: 'Mateo González' },
  { uid: 'student_fernandez', email: 'valentina.fernandez@campus48.local', password: 'campus48pass', name: 'Valentina Fernández' },
  { uid: 'student_rodriguez', email: 'joaquin.rodriguez@campus48.local', password: 'campus48pass', name: 'Joaquín Rodríguez' },
  { uid: 'family_perez',      email: 'padres.perez@campus48.local',      password: 'campus48pass', name: 'Familia Pérez' },
];

async function seedAuth() {
  console.log('🔐 Creando usuarios en Firebase Auth...\n');

  for (const user of USERS) {
    try {
      // Intentar crear con UID fijo
      await admin.auth().createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.name,
      });
      console.log(`✅ Creado: ${user.email}`);
    } catch (err) {
      if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
        console.log(`⚠️  Ya existe: ${user.email} — saltando`);
      } else {
        console.error(`❌ Error con ${user.email}:`, err.message);
      }
    }
  }

  console.log('\n✅ Usuarios de Auth creados.');
  console.log('\n🔑 CREDENCIALES DE ACCESO:');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ ROL       │ EMAIL                              │ CONTRASEÑA      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const u of USERS) {
    const role = u.uid.split('_')[0].toUpperCase().padEnd(9);
    const email = u.email.padEnd(35);
    console.log(`│ ${role} │ ${email} │ campus48pass    │`);
  }
  console.log('└─────────────────────────────────────────────────────────────────┘');

  process.exit(0);
}

seedAuth().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});