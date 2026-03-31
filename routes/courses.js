const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todos los cursos (solo admins, docentes y directivos)
router.get('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher', 'DIRECTOR', 'director']), async (req, res) => {
  try {
    const courses = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('courses').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(courses);
  } catch (err) {
    console.error('Error obteniendo cursos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener un curso por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('courses').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }
    res.json(course);
  } catch (err) {
    console.error('Error obteniendo curso:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear un curso (solo admins)
router.post('/', authenticate, authorize(['ADMIN', 'admin']), async (req, res) => {
  const { name, school_id } = req.body;

  try {
    const course = await runFirestoreOp(async (firestore) => {
      const courseData = {
        name,
        school_id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('courses').add(courseData);
      return { id: docRef.id, ...courseData };
    });
    res.status(201).json(course);
  } catch (err) {
    console.error('Error creando curso:', err);
    res.status(500).json({ error: 'Error al crear curso.' });
  }
});

module.exports = router;
