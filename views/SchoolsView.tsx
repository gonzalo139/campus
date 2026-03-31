
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react';
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

const SchoolsView: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    const q = query(collection(db, 'schools'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schoolsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schools');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'schools', editingId), formData);
      } else {
        await addDoc(collection(db, 'schools'), formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving school:', error);
      alert('Error al guardar la escuela');
    }
  };

  const handleEdit = (school: any) => {
    setEditingId(school.id);
    setFormData({
      name: school.name,
      address: school.address || '',
      phone: school.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta escuela?')) return;
    try {
      await deleteDoc(doc(db, 'schools', id));
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Error al eliminar la escuela');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', address: '', phone: '' });
  };

  const filtered = schools.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando escuelas...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Escuelas</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Administración de Instituciones</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Nueva Escuela</span>
        </button>
      </section>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar escuela..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((school) => (
          <div key={school.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Building2 className="size-6" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(school)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <Edit2 className="size-4" />
                </button>
                <button 
                  onClick={() => handleDelete(school.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{school.name}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">{school.address || 'Sin dirección'}</p>
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-white/5">
              <span>{school.phone || 'Sin teléfono'}</span>
              <span className="text-primary">ACTIVA</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">
              {editingId ? 'Editar Escuela' : 'Nueva Escuela'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
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

export default SchoolsView;
