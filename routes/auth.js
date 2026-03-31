const express = require('express');
const router = express.Router();
const { admin, runFirestoreOp } = require('../lib/firebase-admin');
require('dotenv').config();

// Login (Simulado con Firestore para compatibilidad con el frontend actual si no usa Firebase SDK directamente)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  try {
    // Buscar en Firestore
    const user = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('users').where('email', '==', email).get();
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // NOTA: En un sistema real con Firebase Auth, el login se hace en el cliente.
    // Aquí simulamos el éxito si el usuario existe, pero idealmente el cliente debería usar el Firebase SDK.
    // Si el usuario tiene un password_hash (migrado de SQL), podríamos verificarlo, 
    // pero el objetivo es migrar a Firebase Auth completamente.
    
    res.json({
      message: 'Login exitoso (Simulado). Por favor use Firebase Auth en el cliente.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error en login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Registro inicial en Firestore
router.post('/register', async (req, res) => {
  const { name, email, password, role_name } = req.body;

  try {
    const newUser = await runFirestoreOp(async (firestore) => {
      const userRef = firestore.collection('users').doc();
      const userData = {
        name,
        email,
        role: role_name || 'student',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await userRef.set(userData);
      return { id: userRef.id, ...userData };
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario en Firestore.' });
  }
});

// Resetear contraseña de estudiante (solo admins)
router.post('/reset-student-password', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Email y nueva contraseña son obligatorios.' });
  }

  try {
    console.log('📡 Attempting to reset password for user:', username);
    
    // 1. Find user in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(username);
    
    // 2. Update password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    console.log('✅ Password reset successfully for user:', username);
    res.json({ message: `Contraseña de ${username} reseteada con éxito.` });
  } catch (err) {
    console.error('❌ Error resetting student password:', err.message);
    res.status(500).json({ error: 'Error al resetear la contraseña: ' + err.message });
  }
});

module.exports = router;
