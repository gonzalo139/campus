const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Registrar una co-evaluación (estudiantes, docentes, admins)
router.post('/', authenticate, async (req, res) => {
  const { evaluator_id, evaluated_id, project_id, score, comment } = req.body;

  try {
    // Validar que el evaluador sea el usuario autenticado (si es estudiante)
    if (req.user.role === 'student' && evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'No puedes evaluar en nombre de otro estudiante.' });
    }

    const evaluation = await runFirestoreOp(async (firestore) => {
      const evaluationData = {
        evaluator_id,
        evaluated_id,
        project_id,
        score: Number(score),
        comment,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('peer_evaluations').add(evaluationData);
      return { id: docRef.id, ...evaluationData };
    });
    res.status(201).json(evaluation);
  } catch (err) {
    console.error('Error registrando co-evaluación:', err);
    res.status(500).json({ error: 'Error al registrar co-evaluación.' });
  }
});

// Obtener evaluaciones recibidas por un estudiante
router.get('/received/:studentId', authenticate, async (req, res) => {
  try {
    const evaluations = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('peer_evaluations')
        .where('evaluated_id', '==', req.params.studentId)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(evaluations);
  } catch (err) {
    console.error('Error obteniendo evaluaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
