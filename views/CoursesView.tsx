
import React, { useState, useEffect } from 'react';
import { Plus, Search, GraduationCap, Users, Calendar, Edit2, Trash2 } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', year: new Date().getFullYear(), school_id: '' });

  useEffect(() => {
    // 1. Schools listener
    const unsubscribeSchools = onSnapshot(query(collection(db, 'schools'), orderBy('name', 'asc')), (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schools');
    });

    // 2. Courses listener
    const unsubscribeCourses = onSnapshot(query(collection(db, 'courses'), orderBy('name', 'asc')), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'courses');
    });

    return () => {
      unsubscribeSchools();
      unsubscribeCourses();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), formData);
      } else {
        await addDoc(collection(db, 'courses'), formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error al guardar el curso');
    }
  };

  const handleEdit = (course: any) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      year: course.year,
      school_id: course.school_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error al eliminar el curso');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', year: new Date().getFullYear(), school_id: '' });
  };

  const filtered = courses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando cursos...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Cursos</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Administración de Grados y Divisiones</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Nuevo Curso</span>
        </button>
      </section>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((course) => (
          <div key={course.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <GraduationCap className="size-6" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <Calendar className="size-3" />
                  <span>{course.year}</span>
                </div>
                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => handleEdit(course)}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{course.name}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {schools.find(s => s.id === course.school_id)?.name || 'Sin Escuela'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">{course.student_count || 0} Estudiantes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Promedio: {course.average_xp || 0} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">
              {editingId ? 'Editar Curso' : 'Nuevo Curso'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre del Curso</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Ej: 4to Año - División A"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Año Lectivo</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Escuela</label>
                <select
                  required
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="" className="bg-[#111812] text-white">Seleccionar Escuela...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#111812] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
                >
                  {editingId ? 'GUARDAR' : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesView;
