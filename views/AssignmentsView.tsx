
import React, { useState, useEffect } from 'react';
import { Plus, Link2, User, GraduationCap, BookMarked } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { Role } from '../types';
import { handleFirestoreError, OperationType } from '../services/errorService';

const AssignmentsView: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ teacher_id: '', course_id: '', subject_id: '' });

  useEffect(() => {
    // 1. Teachers listener
    const unsubscribeTeachers = onSnapshot(query(collection(db, 'users'), where('role', 'in', [Role.TEACHER, Role.DOCENTE])), (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // 2. Courses listener
    const unsubscribeCourses = onSnapshot(query(collection(db, 'courses'), orderBy('name', 'asc')), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'courses');
    });

    // 3. Subjects listener
    const unsubscribeSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('name', 'asc')), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subjects');
    });

    // 4. Schools listener
    const unsubscribeSchools = onSnapshot(query(collection(db, 'schools'), orderBy('name', 'asc')), (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schools');
    });

    // 5. Assignments listener
    const unsubscribeAssignments = onSnapshot(collection(db, 'teacher_assignments'), (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teacher_assignments');
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeCourses();
      unsubscribeSubjects();
      unsubscribeSchools();
      unsubscribeAssignments();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teacher = teachers.find(t => t.id === formData.teacher_id);
      const course = courses.find(c => c.id === formData.course_id);
      const subject = subjects.find(s => s.id === formData.subject_id);

      await addDoc(collection(db, 'teacher_assignments'), {
        ...formData,
        teacher_name: teacher?.name || teacher?.email,
        teacher_email: teacher?.email,
        course_name: course?.name,
        subject_name: subject?.name,
        created_at: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ teacher_id: '', course_id: '', subject_id: '' });
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando asignaciones...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Asignaciones Docentes</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Vínculo Docente - Curso - Materia</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Nueva Asignación</span>
        </button>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="size-12 rounded-full border-2 border-primary/20 overflow-hidden mb-2">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.teacher_email}`} alt="Docente" className="size-full object-cover" />
                </div>
                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Docente</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="size-3 text-slate-500" />
                  <span className="text-sm font-bold text-white">{a.teacher_name || a.teacher_email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-3 text-slate-500" />
                    <span className="text-xs text-slate-400 font-medium">
                      {a.course_name} 
                      <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-lg text-[9px] text-primary/70 border border-white/5">
                        {(() => {
                          const course = courses.find(c => String(c.id) === String(a.course_id));
                          const school = schools.find(s => String(s.id) === String(course?.school_id));
                          return school ? school.name : `Escuela no vinculada (${a.course_id})`;
                        })()}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="size-3 text-slate-500" />
                    <span className="text-xs text-slate-400 font-medium">{a.subject_name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-2xl text-slate-500">
              <Link2 className="size-5" />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">Nueva Asignación</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Docente</label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="" className="bg-[#111812] text-white">Seleccionar Docente...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#111812] text-white">
                      {t.name || t.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Curso</label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="" className="bg-[#111812] text-white">Seleccionar Curso...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111812] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Materia</label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="" className="bg-[#111812] text-white">Seleccionar Materia...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#111812] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all">CANCELAR</button>
                <button type="submit" className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all">ASIGNAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsView;
