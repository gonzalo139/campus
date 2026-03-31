const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todos los usuarios (solo admins y directivos)
router.get('/', authenticate, authorize(['ADMIN', 'admin', 'DIRECTOR', 'director']), async (req, res) => {
  try {
    const users = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('users').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(users);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Perfil del usuario autenticado
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('users').doc(req.user.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error obteniendo perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Eliminar usuario (solo admins)
router.delete('/:id', authenticate, authorize(['ADMIN', 'admin']), async (req, res) => {
  try {
    await runFirestoreOp(async (firestore) => {
      await firestore.collection('users').doc(req.params.id).delete();
    });
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

module.exports = router;
