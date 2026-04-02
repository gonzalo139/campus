/**
 * seed.js — Campus48 Data Seed
 * Corre con: node seed.js
 * Requiere service-account.json en la raíz del proyecto
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'campus48-e8356'
  });
}

const db = admin.firestore();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const set = (col, id, data) => db.collection(col).doc(id).set(data);
const add = (col, data) => db.collection(col).add(data);
const now = admin.firestore.FieldValue.serverTimestamp;

// ─────────────────────────────────────────────
// IDs fijos para poder referenciar entre entidades
// ─────────────────────────────────────────────
const IDS = {
  school:    'school_001',
  course1:   'course_1ero_a',
  course2:   'course_2do_a',
  subject1:  'subject_matematica',
  subject2:  'subject_lengua',
  subject3:  'subject_historia',
  teacher1:  'teacher_garcia',
  teacher2:  'teacher_lopez',
  director1: 'director_morales',
  student1:  'student_perez',
  student2:  'student_gonzalez',
  student3:  'student_fernandez',
  student4:  'student_rodriguez',
  family1:   'family_perez',
  mission1:  'mission_001',
  mission2:  'mission_002',
  project1:  'project_001',
  badge1:    'badge_puntual',
  badge2:    'badge_participativo',
  badge3:    'badge_creativo',
};

async function seed() {
  console.log('🌱 Iniciando seed de Campus48...\n');

  // ── 1. SCHOOL ────────────────────────────────
  console.log('🏫 Creando escuela...');
  await set('schools', IDS.school, {
    name: 'Instituto Técnico Campus48',
    address: 'Av. Siempreviva 742, Buenos Aires',
    phone: '011-4567-8900',
    created_at: now()
  });

  // ── 2. COURSES ───────────────────────────────
  console.log('📚 Creando cursos...');
  await set('courses', IDS.course1, {
    name: '1° A',
    year: 2025,
    school_id: IDS.school,
    created_at: now()
  });
  await set('courses', IDS.course2, {
    name: '2° A',
    year: 2025,
    school_id: IDS.school,
    created_at: now()
  });

  // ── 3. SUBJECTS ──────────────────────────────
  console.log('📖 Creando materias...');
  await set('subjects', IDS.subject1, {
    name: 'Matemática',
    description: 'Álgebra, geometría y análisis matemático'
  });
  await set('subjects', IDS.subject2, {
    name: 'Lengua y Literatura',
    description: 'Comprensión lectora, redacción y literatura'
  });
  await set('subjects', IDS.subject3, {
    name: 'Historia',
    description: 'Historia argentina y mundial'
  });

  // ── 4. USERS: DIRECTOR ───────────────────────
  console.log('👔 Creando director...');
  await set('users', IDS.director1, {
    uid: IDS.director1,
    id: IDS.director1,
    email: 'director.morales@campus48.local',
    name: 'Roberto Morales',
    role: 'DIRECTOR',
    school_id: IDS.school,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=morales',
    level: 1,
    xp: 0,
    created_at: now()
  });

  // ── 5. USERS: TEACHERS ───────────────────────
  console.log('👩‍🏫 Creando docentes...');
  await set('users', IDS.teacher1, {
    uid: IDS.teacher1,
    id: IDS.teacher1,
    email: 'garcia@campus48.local',
    name: 'Ana García',
    role: 'TEACHER',
    school_id: IDS.school,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=garcia',
    level: 1,
    xp: 0,
    created_at: now()
  });
  await set('users', IDS.teacher2, {
    uid: IDS.teacher2,
    id: IDS.teacher2,
    email: 'lopez@campus48.local',
    name: 'Carlos López',
    role: 'TEACHER',
    school_id: IDS.school,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lopez',
    level: 1,
    xp: 0,
    created_at: now()
  });

  // ── 6. TEACHER ASSIGNMENTS ───────────────────
  console.log('📋 Asignando docentes a cursos...');
  await add('teacherAssignments', {
    teacher_id: IDS.teacher1,
    course_id: IDS.course1,
    subject_id: IDS.subject1,
    created_at: now()
  });
  await add('teacherAssignments', {
    teacher_id: IDS.teacher1,
    course_id: IDS.course2,
    subject_id: IDS.subject1,
    created_at: now()
  });
  await add('teacherAssignments', {
    teacher_id: IDS.teacher2,
    course_id: IDS.course1,
    subject_id: IDS.subject2,
    created_at: now()
  });
  await add('teacherAssignments', {
    teacher_id: IDS.teacher2,
    course_id: IDS.course1,
    subject_id: IDS.subject3,
    created_at: now()
  });

  // ── 7. USERS: STUDENTS ───────────────────────
  console.log('🎒 Creando estudiantes...');
  const students = [
    { id: IDS.student1, name: 'Lucía Pérez',      email: 'lucia.perez@campus48.local',      course_id: IDS.course1, xp: 320, level: 3 },
    { id: IDS.student2, name: 'Mateo González',   email: 'mateo.gonzalez@campus48.local',   course_id: IDS.course1, xp: 180, level: 2 },
    { id: IDS.student3, name: 'Valentina Fernández', email: 'valentina.fernandez@campus48.local', course_id: IDS.course1, xp: 450, level: 3 },
    { id: IDS.student4, name: 'Joaquín Rodríguez', email: 'joaquin.rodriguez@campus48.local', course_id: IDS.course2, xp: 90,  level: 1 },
  ];

  for (const s of students) {
    // User profile
    await set('users', s.id, {
      uid: s.id,
      id: s.id,
      email: s.email,
      name: s.name,
      role: 'STUDENT',
      school_id: IDS.school,
      course_id: s.course_id,
      student_id: s.id,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
      level: s.level,
      xp: s.xp,
      total_points: s.xp,
      created_at: now()
    });
    // Student record
    await set('students', s.id, {
      name: s.name,
      email: s.email,
      user_id: s.id,
      school_id: IDS.school,
      course_id: s.course_id,
      created_at: now()
    });
  }

  // ── 8. USERS: FAMILY ─────────────────────────
  console.log('👨‍👩‍👧 Creando familia...');
  await set('users', IDS.family1, {
    uid: IDS.family1,
    id: IDS.family1,
    email: 'padres.perez@campus48.local',
    name: 'Familia Pérez',
    role: 'FAMILY',
    student_id: IDS.student1,   // vinculada a Lucía Pérez
    school_id: IDS.school,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=family_perez',
    level: 1,
    xp: 0,
    created_at: now()
  });

  // ── 9. MISSIONS ──────────────────────────────
  console.log('🎯 Creando misiones...');
  await set('missions', IDS.mission1, {
    title: 'Proyecto Integrador: Resolución de Problemas',
    description: 'Desarrollar un proyecto que integre matemática, lengua e historia para resolver un problema real de la comunidad.',
    year: 2025,
    is_active: true,
    assign_date: '2025-03-01',
    due_date: '2025-04-30',
    max_xp: 200,
    created_at: now()
  });
  await set('missions', IDS.mission2, {
    title: 'Exposición Oral: Mi Barrio en la Historia',
    description: 'Investigar y exponer oralmente la historia del barrio o localidad donde viven.',
    year: 2025,
    is_active: true,
    assign_date: '2025-03-15',
    due_date: '2025-05-15',
    max_xp: 150,
    created_at: now()
  });

  // ── 10. PROJECTS ─────────────────────────────
  console.log('🔨 Creando proyectos...');
  await set('projects', IDS.project1, {
    title: 'App de Reciclaje Comunitario',
    description: 'Diseñar una solución digital para mejorar el reciclaje en el barrio.',
    max_points: 100,
    type: 'EQUIPO',
    course_id: IDS.course1,
    created_at: now()
  });

  // ── 11. BADGES ───────────────────────────────
  console.log('🏅 Creando badges...');
  await set('badges', IDS.badge1, {
    name: 'Puntual',
    description: 'Asistencia perfecta durante un mes',
    icon: '⏰'
  });
  await set('badges', IDS.badge2, {
    name: 'Participativo',
    description: 'Participó activamente en 10 clases',
    icon: '🙋'
  });
  await set('badges', IDS.badge3, {
    name: 'Creativo',
    description: 'Entregó un proyecto destacado por creatividad',
    icon: '🎨'
  });

  // ── 12. STUDENT BADGES ───────────────────────
  console.log('🎖️ Asignando badges a estudiantes...');
  await add('studentBadges', {
    student_id: IDS.student1,
    badge_id: IDS.badge1,
    earned_at: '2025-03-31'
  });
  await add('studentBadges', {
    student_id: IDS.student1,
    badge_id: IDS.badge3,
    earned_at: '2025-04-10'
  });
  await add('studentBadges', {
    student_id: IDS.student3,
    badge_id: IDS.badge2,
    earned_at: '2025-04-05'
  });

  // ── 13. POINTS ───────────────────────────────
  console.log('💎 Cargando puntos...');
  const pointsData = [
    { user_id: IDS.student1, points: 120, mission_id: IDS.mission1, reason: 'Entrega excelente proyecto integrador' },
    { user_id: IDS.student1, points: 200, mission_id: IDS.mission2, reason: 'Exposición oral destacada' },
    { user_id: IDS.student2, points: 180, mission_id: IDS.mission1, reason: 'Buena resolución de problemas' },
    { user_id: IDS.student3, points: 250, mission_id: IDS.mission1, reason: 'Proyecto creativo sobresaliente' },
    { user_id: IDS.student3, points: 200, mission_id: IDS.mission2, reason: 'Investigación muy completa' },
    { user_id: IDS.student4, points: 90,  mission_id: IDS.mission1, reason: 'Participación activa' },
  ];
  for (const p of pointsData) {
    await add('points', { ...p, created_at: now() });
  }

  // ── 14. ATTENDANCE ───────────────────────────
  console.log('📅 Cargando asistencia...');
  const dates = ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-07', '2025-04-08'];
  const attendanceMatrix = {
    [IDS.student1]: [true,  true,  true,  true,  true],
    [IDS.student2]: [true,  false, true,  true,  false],
    [IDS.student3]: [true,  true,  true,  true,  true],
    [IDS.student4]: [false, true,  true,  false, true],
  };
  for (const [student_id, presences] of Object.entries(attendanceMatrix)) {
    for (let i = 0; i < dates.length; i++) {
      await add('attendance', {
        date: dates[i],
        student_id,
        present: presences[i],
        course_id: student_id === IDS.student4 ? IDS.course2 : IDS.course1,
        created_at: now()
      });
    }
  }

  // ── 15. ALERTS ───────────────────────────────
  console.log('🚨 Creando alertas...');
  await add('alerts', {
    student_id: IDS.student2,
    student_name: 'Mateo González',
    type: 'ATTENDANCE',
    severity: 'MEDIUM',
    message: 'Mateo González tuvo 2 ausencias en la última semana.',
    date: '2025-04-08'
  });
  await add('alerts', {
    student_id: IDS.student4,
    student_name: 'Joaquín Rodríguez',
    type: 'PERFORMANCE',
    severity: 'HIGH',
    message: 'Joaquín Rodríguez tiene el puntaje más bajo del curso.',
    date: '2025-04-08'
  });

  // ── 16. SUBMISSIONS ──────────────────────────
  console.log('📤 Cargando entregas...');
  await add('submissions', {
    student_id: IDS.student1,
    mission_id: IDS.mission1,
    url: 'https://drive.google.com/ejemplo-lucia',
    status: 'APPROVED',
    grades: { trayectoria: 9, explicacion: 10, entrega: 9, reflexion: 8 },
    created_at: now()
  });
  await add('submissions', {
    student_id: IDS.student2,
    mission_id: IDS.mission1,
    url: 'https://drive.google.com/ejemplo-mateo',
    status: 'APPROVED',
    grades: { trayectoria: 7, explicacion: 8, entrega: 7, reflexion: 7 },
    created_at: now()
  });
  await add('submissions', {
    student_id: IDS.student3,
    mission_id: IDS.mission1,
    url: 'https://drive.google.com/ejemplo-valentina',
    status: 'APPROVED',
    grades: { trayectoria: 10, explicacion: 9, entrega: 10, reflexion: 9 },
    created_at: now()
  });
  await add('submissions', {
    student_id: IDS.student4,
    mission_id: IDS.mission1,
    url: 'https://drive.google.com/ejemplo-joaquin',
    status: 'PENDING',
    grades: {},
    created_at: now()
  });

  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n📋 RESUMEN:');
  console.log('  🏫 1 escuela: Instituto Técnico Campus48');
  console.log('  📚 2 cursos: 1°A y 2°A');
  console.log('  📖 3 materias: Matemática, Lengua, Historia');
  console.log('  👔 1 director: Roberto Morales  (director.morales@campus48.local)');
  console.log('  👩‍🏫 2 docentes:  Ana García (garcia@campus48.local), Carlos López (lopez@campus48.local)');
  console.log('  🎒 4 alumnos:  Lucía Pérez, Mateo González, Valentina Fernández, Joaquín Rodríguez');
  console.log('  👨‍👩‍👧 1 familia:  Familia Pérez → vinculada a Lucía Pérez (padres.perez@campus48.local)');
  console.log('\n⚠️  CONTRASEÑAS: Todos los usuarios locales usan contraseña → campus48pass');
  console.log('   Para crear sus cuentas en Firebase Auth, corré: node seed-auth.js\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('💥 Error en seed:', err);
  process.exit(1);
});