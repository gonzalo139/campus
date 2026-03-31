const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { admin, runFirestoreOp } = require('./lib/firebase-admin');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('🚀 Starting Campus48 Server...');
  
  // 1. Data Initialization (if needed)
  try {
    await runFirestoreOp(async (firestore) => {
      const levelsSnapshot = await firestore.collection('levels').limit(1).get();
      if (levelsSnapshot.empty) {
        console.log('📦 Initializing default levels in Firestore...');
        const initialLevels = [
          { level: 1, name: 'Novato', min_xp: 0 },
          { level: 2, name: 'Aprendiz', min_xp: 100 },
          { level: 3, name: 'Explorador', min_xp: 300 },
          { level: 4, name: 'Iniciado', min_xp: 600 },
          { level: 5, name: 'Maestro', min_xp: 1000 }
        ];
        for (const lvl of initialLevels) {
          await firestore.collection('levels').add(lvl);
        }
        console.log('✅ Default levels initialized.');
      }
    });
  } catch (err) {
    console.warn('⚠️ Auto-initialization warning:', err.message);
  }

  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT
  });

  // 2. Middlewares
  app.use(express.json());
  app.use(cors());

  // 3. Health Check & Diagnostics
  app.get('/health', async (req, res) => {
    let firestoreStatus = 'UNKNOWN';
    try {
      await runFirestoreOp(async (firestore) => {
        await firestore.collection('_internal_').doc('health_check').set({
          last_ping: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      firestoreStatus = 'OK';
    } catch (err) {
      console.error('❌ Firestore health check failed:', err.message);
      firestoreStatus = `ERROR: ${err.message}`;
    }

    res.json({ 
      status: 'OK', 
      firestore: firestoreStatus,
      timestamp: new Date().toISOString(), 
      mode: process.env.NODE_ENV || 'development'
    });
  });

  // 4. API Routes
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const studentRoutes = require('./routes/students');
  const courseRoutes = require('./routes/courses');
  const schoolRoutes = require('./routes/schools');
  const subjectRoutes = require('./routes/subjects');
  const projectRoutes = require('./routes/projects');
  const missionRoutes = require('./routes/missions');
  const attendanceRoutes = require('./routes/attendance');
  const pointRoutes = require('./routes/points');
  const assignmentRoutes = require('./routes/teacher-assignments');
  const evaluationRoutes = require('./routes/peer-evaluations');
  const gamificationRoutes = require('./routes/gamification');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/schools', schoolRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/missions', missionRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/points', pointRoutes);
  app.use('/api/teacher-assignments', assignmentRoutes);
  app.use('/api/peer-evaluations', evaluationRoutes);
  app.use('/api', gamificationRoutes);

  // 5. Global Error Handler
  app.use((err, req, res, next) => {
    console.error('🚨 Global Error Handler:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // 6. Frontend Integration (Vite)
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('🛠️ Configuring Vite middleware...');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      // Catch-all route to serve index.html in development
      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });

      console.log('✅ Vite middleware configured.');
    } catch (err) {
      console.error('❌ Error starting Vite:', err);
      app.get('/', (req, res) => {
        res.status(500).send('Error loading Vite middleware.');
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Start Listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Campus48 server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('💥 Fatal error during server startup:', err);
});
