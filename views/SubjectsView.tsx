
import React, { useState, useEffect } from 'react';
import { Plus, Search, BookMarked, BookOpen, Edit2, Trash2 } from 'lucide-react';
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

const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    const q = query(collection(db, 'subjects'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subjects');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'subjects', editingId), formData);
      } else {
        await addDoc(collection(db, 'subjects'), formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Error al guardar la materia');
    }
  };

  const handleEdit = (subject: any) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      description: subject.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta materia?')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Error al eliminar la materia');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando materias...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Materias</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Administración del Currículum</p>
          <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest mt-2 italic">* Las materias se asignan a los cursos desde la sección de Asignaciones Docentes</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Nueva Materia</span>
        </button>
      </section>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar materia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((subject) => (
          <div key={subject.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <BookMarked className="size-6" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(subject)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <Edit2 className="size-4" />
                </button>
                <button 
                  onClick={() => handleDelete(subject.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{subject.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">{subject.description || 'Sin descripción'}</p>
            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              <BookOpen className="size-4 text-slate-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenido Académico</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">
              {editingId ? 'Editar Materia' : 'Nueva Materia'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre de la Materia</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Ej: NTICx"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all min-h-[100px]"
                  placeholder="Detalles de la materia..."
                />
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

export default SubjectsView;
