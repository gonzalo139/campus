const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todas las escuelas (solo admins y directivos)
router.get('/', authenticate, authorize(['admin', 'director']), async (req, res) => {
  try {
    const schools = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('schools').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(schools);
  } catch (err) {
    console.error('Error obteniendo escuelas:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener una escuela por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const school = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('schools').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!school) {
      return res.status(404).json({ error: 'Escuela no encontrada.' });
    }
    res.json(school);
  } catch (err) {
    console.error('Error obteniendo escuela:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear una escuela (solo admins)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, location } = req.body;

  try {
    const school = await runFirestoreOp(async (firestore) => {
      const schoolData = {
        name,
        location,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('schools').add(schoolData);
      return { id: docRef.id, ...schoolData };
    });
    res.status(201).json(school);
  } catch (err) {
    console.error('Error creando escuela:', err);
    res.status(500).json({ error: 'Error al crear escuela.' });
  }
});

module.exports = router;
