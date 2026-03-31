const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todos los estudiantes (solo admins, docentes y directivos)
router.get('/', authenticate, authorize(['admin', 'teacher', 'director']), async (req, res) => {
  try {
    const students = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('students').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(students);
  } catch (err) {
    console.error('Error obteniendo estudiantes:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener un estudiante por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('students').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    // Estudiantes solo pueden ver sus propios datos
    if (req.user.role === 'student' && student.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos datos.' });
    }
    res.json(student);
  } catch (err) {
    console.error('Error obteniendo estudiante:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear un estudiante (solo admins)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, user_id, school_id, course_id } = req.body;

  try {
    const student = await runFirestoreOp(async (firestore) => {
      const studentData = {
        name,
        email,
        user_id,
        school_id,
        course_id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('students').add(studentData);
      return { id: docRef.id, ...studentData };
    });
    res.status(201).json(student);
  } catch (err) {
    console.error('Error creando estudiante:', err);
    res.status(500).json({ error: 'Error al crear estudiante.' });
  }
});

module.exports = router;
