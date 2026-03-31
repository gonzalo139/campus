const express = require('express');
const router = express.Router();
const { admin, getFirestoreDb, runFirestoreOp } = require('../lib/firebase-admin');
const { authenticate, authorize } = require('../middlewares/auth');

// --- RUTAS DE NIVELES ---

// Obtener todos los niveles
router.get('/levels', authenticate, async (req, res) => {
  console.log('GET /levels requested by:', req.user.email);
  try {
    const levels = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('levels').orderBy('level', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(levels);
  } catch (err) {
    console.error('Error obteniendo niveles:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTAS DE INSIGNIAS (BADGES) ---

// Obtener todas las insignias
router.get('/badges', authenticate, async (req, res) => {
  console.log('GET /badges requested by:', req.user.email);
  try {
    const badges = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('badges').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    res.json(badges);
  } catch (err) {
    console.error('Error obteniendo insignias:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Crear una insignia (solo admins)
router.post('/badges', authenticate, authorize(['ADMIN', 'admin']), async (req, res) => {
  const { name, description, icon } = req.body;
  console.log('POST /badges requested by:', req.user.email, { name, description, icon });
  try {
    const badge = await runFirestoreOp(async (firestore) => {
      const badgeData = {
        name,
        description,
        icon: icon || 'award',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore.collection('badges').add(badgeData);
      console.log('✅ Insignia creada con ID:', docRef.id);
      return { id: docRef.id, ...badgeData };
    });
    res.status(201).json(badge);
  } catch (err) {
    console.error('Error creando insignia:', err);
    res.status(500).json({ error: 'Error al crear insignia.' });
  }
});

// Obtener insignias de un estudiante
router.get('/students/:id/badges', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const earnedBadges = await runFirestoreOp(async (firestore) => {
      const snapshot = await firestore.collection('student_badges')
        .where('student_id', '==', id)
        .get();
      
      const badges = [];
      for (const doc of snapshot.docs) {
        const sb = doc.data();
        const badgeDoc = await firestore.collection('badges').doc(sb.badge_id).get();
        if (badgeDoc.exists) {
          badges.push({
            ...badgeDoc.data(),
            id: badgeDoc.id,
            earned_at: sb.earned_at
          });
        }
      }
      return badges;
    });
    res.json(earnedBadges);
  } catch (err) {
    console.error('Error obteniendo insignias del estudiante:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Asignar insignia a un estudiante (solo docentes y admins)
router.post('/students/:id/badges', authenticate, authorize(['ADMIN', 'admin', 'TEACHER', 'teacher']), async (req, res) => {
  const { badge_id } = req.body;
  const student_id = req.params.id;
  try {
    const result = await runFirestoreOp(async (firestore) => {
      const querySnapshot = await firestore.collection('student_badges')
        .where('student_id', '==', student_id)
        .where('badge_id', '==', badge_id)
        .get();

      if (!querySnapshot.empty) {
        return { message: 'Insignia ya asignada', status: 200 };
      }

      const assignmentData = {
        student_id,
        badge_id,
        earned_at: admin.firestore.FieldValue.serverTimestamp()
      };
      await firestore.collection('student_badges').add(assignmentData);
      return { ...assignmentData, status: 201 };
    });
    
    res.status(result.status).json(result);
  } catch (err) {
    console.error('Error asignando insignia:', err);
    res.status(500).json({ error: 'Error al asignar insignia.' });
  }
});

module.exports = router;
