
import React, { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, FolderKanban, Users, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

const ProjectsView: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', max_points: 100, type: 'INDIVIDUAL' });
  const [error, setError] = useState<string | null>(null);

  const isAdminUser = user?.role?.toUpperCase() === 'ADMIN' || 
                     user?.role?.toUpperCase() === 'TEACHER' || 
                     user?.role?.toUpperCase() === 'DIRECTOR' ||
                     user?.email === 'jrodriguezncs@gmail.com';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching projects from Firestore...');
      const q = query(collection(db, 'projects'), orderBy('title', 'asc'));
      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      console.log('✅ Projects loaded:', projectsData.length);
    } catch (err: any) {
      console.error('❌ Error fetching projects:', err.message);
      setError('Error al cargar proyectos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        console.log('📡 Updating project:', editingId);
        const projectRef = doc(db, 'projects', editingId);
        await updateDoc(projectRef, {
          ...formData,
          updated_at: serverTimestamp()
        });
        console.log('✅ Project updated');
      } else {
        console.log('📡 Creating new project...');
        await addDoc(collection(db, 'projects'), {
          ...formData,
          created_at: serverTimestamp(),
          created_by: user?.id
        });
        console.log('✅ Project created');
      }
      fetchProjects();
      handleCloseModal();
    } catch (err: any) {
      console.error('❌ Error saving project:', err.message);
      setError('Error al guardar el proyecto: ' + err.message);
    }
  };

  const handleEdit = (project: any) => {
    setEditingId(project.id);
    setFormData({
      title: project.title,
      description: project.description,
      max_points: project.max_points,
      type: project.type
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;
    setError(null);
    try {
      console.log('📡 Deleting project:', id);
      await deleteDoc(doc(db, 'projects', id));
      console.log('✅ Project deleted');
      fetchProjects();
    } catch (err: any) {
      console.error('❌ Error deleting project:', err.message);
      setError('Error al eliminar el proyecto: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', description: '', max_points: 100, type: 'INDIVIDUAL' });
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black tracking-widest">Cargando proyectos...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Proyectos</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Creación y Seguimiento de Desafíos</p>
        </div>
        {isAdminUser && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
          >
            <Plus className="size-5" />
            <span className="text-xs font-black uppercase tracking-tight">Nuevo Proyecto</span>
          </button>
        )}
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <FolderKanban className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{p.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/10">{p.type}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{p.max_points} XP MÁX</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Activo</span>
                </div>
                {isAdminUser && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">{p.description}</p>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregas Disponibles</span>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Detalles</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No hay proyectos creados aún</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">
              {editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título del Proyecto</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">XP Máximo</label>
                  <input
                    type="number"
                    required
                    value={formData.max_points}
                    onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="EQUIPO">EQUIPO</option>
                  </select>
                </div>
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

export default ProjectsView;
