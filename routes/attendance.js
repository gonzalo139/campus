const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// Registrar asistencia (solo docentes y admins)
router.post('/', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher']), async (req, res) => {
  const { student_id, course_id, date, status } = req.body;

  try {
    const attendance = await runFirestoreOp(async (firestore) => {
      const attendanceData = {
        student_id,
        course_id,
        date,
        status,
        teacher_id: req.user.id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('attendance').add(attendanceData);
      return { id: docRef.id, ...attendanceData };
    });
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error registrando asistencia:', err);
    res.status(500).json({ error: 'Error al registrar asistencia.' });
  }
});

// Obtener asistencia por curso y fecha
router.get('/course/:courseId', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher', 'DIRECTOR', 'director']), async (req, res) => {
  const { date } = req.query;
  try {
    const attendance = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('attendance')
        .where('course_id', '==', req.params.courseId)
        .where('date', '==', date)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(attendance);
  } catch (err) {
    console.error('Error obteniendo asistencia:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
