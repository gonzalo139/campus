const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Asignar puntos a un estudiante (solo docentes y admins)
router.post('/assign', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher']), async (req, res) => {
  const { student_id, points, reason, mission_id } = req.body;

  try {
    const transaction = await runFirestoreOp(async (firestore) => {
      const transactionData = {
        student_id,
        points: Number(points),
        reason,
        mission_id,
        teacher_id: req.user.id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Guardar transacción
      await firestore.collection('point_transactions').add(transactionData);
      
      // Actualizar total del estudiante
      const studentRef = firestore.collection('users').doc(student_id);
      await firestore.runTransaction(async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (studentDoc.exists) {
          const currentPoints = studentDoc.data().total_points || 0;
          transaction.update(studentRef, { total_points: currentPoints + Number(points) });
        }
      });
      return transactionData;
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error asignando puntos:', err);
    res.status(500).json({ error: 'Error al asignar puntos.' });
  }
});

// Obtener historial de puntos de un estudiante
router.get('/history/:studentId', authenticate, async (req, res) => {
  try {
    const history = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('point_transactions')
        .where('student_id', '==', req.params.studentId)
        .orderBy('created_at', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(history);
  } catch (err) {
    console.error('Error obteniendo historial de puntos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
