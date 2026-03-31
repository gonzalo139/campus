const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todas las asignaciones docentes (solo admins y directivos)
router.get('/', authenticate, authorize(['admin', 'director']), async (req, res) => {
  try {
    const assignments = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('teacher_assignments').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(assignments);
  } catch (err) {
    console.error('Error obteniendo asignaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear una asignación docente (solo admins)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { teacher_id, subject_id, course_id } = req.body;

  try {
    const assignment = await runFirestoreOp(async (firestore) => {
      const assignmentData = {
        teacher_id,
        subject_id,
        course_id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('teacher_assignments').add(assignmentData);
      return { id: docRef.id, ...assignmentData };
    });
    res.status(201).json(assignment);
  } catch (err) {
    console.error('Error creando asignación:', err);
    res.status(500).json({ error: 'Error al crear asignación.' });
  }
});

module.exports = router;
