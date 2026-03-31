const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Listar todos los proyectos (solo admins, docentes y directivos)
router.get('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher', 'DIRECTOR', 'director']), async (req, res) => {
  try {
    const projects = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('projects').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(projects);
  } catch (err) {
    console.error('Error obteniendo proyectos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener un proyecto por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await runFirestoreOp(async (firestore) => {
      const doc = await firestore.collection('projects').doc(req.params.id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    res.json(project);
  } catch (err) {
    console.error('Error obteniendo proyecto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear un proyecto (solo admins y docentes)
router.post('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher']), async (req, res) => {
  const { name, description, subject_id, course_id } = req.body;

  try {
    const project = await runFirestoreOp(async (firestore) => {
      const projectData = {
        name,
        description,
        subject_id,
        course_id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('projects').add(projectData);
      return { id: docRef.id, ...projectData };
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creando proyecto:', err);
    res.status(500).json({ error: 'Error al crear proyecto.' });
  }
});

module.exports = router;
