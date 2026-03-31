const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todas las materias (solo admins, docentes y directivos)
router.get('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher', 'DIRECTOR', 'director']), async (req, res) => {
  try {
    const subjects = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('subjects').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(subjects);
  } catch (err) {
    console.error('Error obteniendo materias:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener una materia por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subject = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('subjects').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!subject) {
      return res.status(404).json({ error: 'Materia no encontrada.' });
    }
    res.json(subject);
  } catch (err) {
    console.error('Error obteniendo materia:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear una materia (solo admins)
router.post('/', authenticate, authorize(['ADMIN', 'admin']), async (req, res) => {
  const { name, description } = req.body;

  try {
    const subject = await runFirestoreOp(async (firestore) => {
      const subjectData = {
        name,
        description,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('subjects').add(subjectData);
      return { id: docRef.id, ...subjectData };
    });
    res.status(201).json(subject);
  } catch (err) {
    console.error('Error creando materia:', err);
    res.status(500).json({ error: 'Error al crear materia.' });
  }
});

module.exports = router;
