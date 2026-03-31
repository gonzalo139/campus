const jwt = require('jsonwebtoken');
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado o inválido.' });
  }

  try {
    // 1. Verificar Firebase Token (Única fuente de verdad por ahora)
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    let user = null;

    // 2. Buscar en Firestore
    let userDoc;
    try {
      if (typeof runFirestoreOp !== 'function') {
        throw new Error('runFirestoreOp no está definido o no es una función');
      }
      userDoc = await runFirestoreOp(async (firestore) => {
        return await firestore.collection('users').doc(decodedToken.uid).get();
      });
    } catch (fsErr) {
      console.error('❌ Error crítico accediendo a Firestore en autenticación:', fsErr.message);
      userDoc = { exists: false };
    }

    if (userDoc.exists) {
      const firestoreUser = userDoc.data();
      user = { 
        id: decodedToken.uid, 
        email: decodedToken.email, 
        role: firestoreUser.role || 'student', 
        firebase_uid: decodedToken.uid 
      };
      console.log('👤 Usuario encontrado en Firestore:', user);
    } else {
      // 3. Si el usuario no existe, crear un perfil básico en Firestore
      const isAdmin = decodedToken.email === 'jrodriguezncs@gmail.com';
      const roleName = isAdmin ? 'admin' : 'student';
      
      user = { 
        id: decodedToken.uid, 
        email: decodedToken.email, 
        role: roleName,
        firebase_uid: decodedToken.uid 
      };
      console.log('👤 Usuario nuevo, creando perfil:', user);

      // Guardar en Firestore para persistencia
      try {
        if (typeof runFirestoreOp === 'function') {
          await runFirestoreOp(async (firestore) => {
            await firestore.collection('users').doc(decodedToken.uid).set({
              uid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || decodedToken.email,
              role: roleName,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
        } else {
          console.error('❌ runFirestoreOp no disponible para crear usuario.');
        }
      } catch (createErr) {
        console.error('❌ Error creando usuario en Firestore:', createErr.message);
      }
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Error crítico en autenticación:', err.message);
    if (err.message.includes('PERMISSION_DENIED')) {
      return res.status(403).json({ 
        error: 'Error de permisos en el servidor de base de datos.',
        details: 'El servidor no tiene permisos para acceder a Firestore.'
      });
    }
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const authorize = (rolesPermitidos = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Usuario no autenticado o sin rol asignado.' });
    }
    
    // Normalizar a minúsculas para comparación
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = rolesPermitidos.map(r => r.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `No autorizado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}` });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
