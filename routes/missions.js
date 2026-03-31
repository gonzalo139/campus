const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todas las misiones (solo admins, docentes y directivos)
router.get('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher', 'DIRECTOR', 'director']), async (req, res) => {
  try {
    const missions = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('missions').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(missions);
  } catch (err) {
    console.error('Error obteniendo misiones:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener una misión por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const mission = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('missions').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!mission) {
      return res.status(404).json({ error: 'Misión no encontrada.' });
    }
    res.json(mission);
  } catch (err) {
    console.error('Error obteniendo misión:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear una misión (solo admins y docentes)
router.post('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher']), async (req, res) => {
  const { name, description, points, project_id } = req.body;

  try {
    const mission = await runFirestoreOp(async (firestore) => {
      const missionData = {
        name,
        description,
        points: Number(points),
        project_id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('missions').add(missionData);
      return { id: docRef.id, ...missionData };
    });
    res.status(201).json(mission);
  } catch (err) {
    console.error('Error creando misión:', err);
    res.status(500).json({ error: 'Error al crear misión.' });
  }
});

module.exports = router;
