
import React, { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import { GraduationCap, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Role } from '../types';

const MyCoursesView: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching teacher assignments for user:', user?.id);
      const q = query(collection(db, 'teacher_assignments'), where('teacher_id', '==', user?.id));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(data);
      console.log('✅ Assignments loaded:', data.length);
    } catch (err: any) {
      console.error('❌ Error fetching teacher assignments:', err.message);
      setError('Error al cargar asignaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    setStudents([]);
    setError(null);
    try {
      console.log('📡 Fetching students for course:', courseId);
      const q = query(
        collection(db, 'users'), 
        where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]),
        where('course_id', '==', courseId),
        orderBy('total_points', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      console.log('✅ Students loaded:', data.length);
    } catch (err: any) {
      console.error('❌ Error fetching course students:', err.message);
      setError('Error al cargar estudiantes: ' + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black tracking-widest">Cargando tus cursos...</div>;

  if (selectedCourse) {
    return (
      <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
        >
          <ChevronRight className="size-3 rotate-180" />
          Volver a mis cursos
        </button>

        <section className="flex items-center justify-between mb-4 px-2">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase">{selectedCourse.course_name}</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{selectedCourse.subject_name}</p>
          </div>
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <GraduationCap className="size-8" />
          </div>
        </section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-lg font-black tracking-tight text-white uppercase">Estudiantes del Curso</h2>
            <Users className="size-5 text-slate-500" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            {students.length > 0 ? students.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`} className="size-10 rounded-xl border border-white/10" alt={s.name} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{s.name || 'Sin nombre'}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.email}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-primary">{s.total_points || 0} XP</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Nivel {s.level || 1}</span>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No hay estudiantes registrados en este curso</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Mis Cursos Asignados</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Materias y Grupos a Cargo</p>
        </div>
        <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
          <BookOpen className="size-8" />
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a) => (
          <button 
            key={a.id} 
            onClick={() => {
              setSelectedCourse(a);
              fetchCourseStudents(a.course_id);
            }}
            className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <GraduationCap className="size-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{a.course_name}</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-widest">{a.subject_name}</p>
              </div>
            </div>
            <ChevronRight className="size-6 text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
        {assignments.length === 0 && (
          <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No tienes cursos asignados actualmente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesView;
