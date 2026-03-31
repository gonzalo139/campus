
import React, { useState, useEffect } from 'react';
import { Search, User, GraduationCap } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { Role } from '../types';
import { handleFirestoreError, OperationType } from '../services/errorService';

const StudentAssignmentsView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Students listener
    const unsubscribeStudents = onSnapshot(query(collection(db, 'users'), where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE])), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // 2. Courses listener
    const unsubscribeCourses = onSnapshot(query(collection(db, 'courses'), orderBy('name', 'asc')), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'courses');
    });

    return () => {
      unsubscribeStudents();
      unsubscribeCourses();
    };
  }, []);

  const handleAssign = async (studentId: string, courseId: string) => {
    setUpdatingId(studentId);
    try {
      await updateDoc(doc(db, 'users', studentId), { course_id: courseId });
    } catch (error) {
      console.error('Error assigning student to course:', error);
      alert('Error al asignar el curso');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando asignaciones de estudiantes...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Asignación de Estudiantes</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Vínculo Estudiante - Curso</p>
        </div>
      </section>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar estudiante por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] p-4 border-b border-white/10 bg-white/5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Estudiante</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right mr-4">Curso Asignado</span>
        </div>
        {filtered.map((s) => (
          <div key={s.id} className="grid grid-cols-[1fr_1fr_1fr] items-center p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-4">
              <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`} className="size-10 rounded-xl border border-white/10" alt={s.name} />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{s.name || 'Sin nombre'}</span>
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Estudiante</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">{s.email}</span>
            </div>
            <div className="flex justify-end pr-4">
              <div className="relative w-full max-w-[200px]">
                <select
                  value={s.course_id || ''}
                  onChange={(e) => handleAssign(s.id, e.target.value)}
                  disabled={updatingId === s.id}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:border-primary/50 transition-all appearance-none ${updatingId === s.id ? 'opacity-50' : ''}`}
                >
                  <option value="" className="bg-[#111812] text-white">Sin Curso</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111812] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {updatingId === s.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t border-primary"></div>
                  ) : (
                    <GraduationCap className="size-3 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="p-20 text-center bg-white/5 border border-white/10 rounded-[2.5rem]">
          <User className="size-12 text-slate-700 mx-auto mb-4 opacity-20" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron estudiantes</p>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsView;
