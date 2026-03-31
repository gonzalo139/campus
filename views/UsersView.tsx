
import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Edit2, Trash2, Key } from 'lucide-react';
import { Role, User } from '../types';
import { useAuth } from '../components/AuthContext';
import { db } from '../src/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';
import axios from 'axios';

const UsersView: React.FC = () => {
  const { user: currentUser, registerUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: Role.STUDENT, password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ ...doc.data() } as User));
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Security check: Only admins can create/edit admins
      if (formData.role === Role.ADMIN && currentUser?.role !== Role.ADMIN) {
        alert('No tienes permisos para asignar el rol de Administrador');
        return;
      }

      if (editingId) {
        const { password, ...updateData } = formData;
        const email = updateData.email.includes('@') ? updateData.email : `${updateData.email}@campus48.local`;
        await updateDoc(doc(db, 'users', editingId), {
          ...updateData,
          email,
          updated_at: serverTimestamp()
        });
      } else {
        if (!formData.password) {
          alert('La contraseña es obligatoria para nuevos usuarios');
          return;
        }
        
        const { password, ...userData } = formData;
        await registerUser(userData as User, password);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Error al guardar el usuario: ${error.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;
    
    setResetLoading(true);
    try {
      await axios.post('/api/auth/reset-student-password', {
        username: resettingUser.email,
        newPassword: newPassword
      });
      alert(`Contraseña de ${resettingUser.name} reseteada con éxito`);
      setShowResetModal(false);
      setNewPassword('');
      setResettingUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Error al resetear la contraseña: ${error.response?.data?.message || error.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.uid);
    setFormData({
      name: user.name || '',
      email: user.email.endsWith('@campus48.local') ? user.email.split('@')[0] : user.email,
      role: user.role as Role,
      password: '' // Don't show password on edit
    });
    setShowModal(true);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Nota: Esto solo elimina el perfil de la base de datos, no la cuenta de acceso.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: Role.STUDENT, password: '' });
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando usuarios...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Usuarios</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Administración de Docentes y Estudiantes</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Nuevo Usuario</span>
        </button>
      </section>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_160px_100px] p-4 border-b border-white/10 bg-white/5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right mr-4">Rol</span>
        </div>
        {filtered.map((u) => (
          <div key={u.uid} className="grid grid-cols-[1fr_1fr_160px_100px] items-center p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-4">
              <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="size-10 rounded-xl border border-white/10" alt={u.name} />
              <span className="text-sm font-bold text-white">{u.name || 'Sin nombre'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-3 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">
                {u.email.endsWith('@campus48.local') ? u.email.split('@')[0] : u.email}
              </span>
            </div>
            <div className="flex justify-center gap-1">
              <button 
                onClick={() => handleEdit(u)}
                title="Editar Perfil"
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <Edit2 className="size-4" />
              </button>
              <button 
                onClick={() => {
                  setResettingUser(u);
                  setShowResetModal(true);
                }}
                title="Resetear Contraseña"
                className="p-2 text-slate-500 hover:text-primary transition-colors"
              >
                <Key className="size-4" />
              </button>
              <button 
                onClick={() => handleDelete(u.uid)}
                title="Eliminar Perfil"
                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="flex justify-end">
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                u.role === Role.ADMIN ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                u.role === Role.TEACHER ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                {u.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Creación/Edición */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Usuario / Email</label>
                <input
                  type="text"
                  required
                  placeholder="ej: juanperez o juan@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña Inicial</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value={Role.STUDENT} className="bg-[#111812] text-white">ESTUDIANTE</option>
                  <option value={Role.TEACHER} className="bg-[#111812] text-white">DOCENTE</option>
                  <option value={Role.DIRECTOR} className="bg-[#111812] text-white">DIRECTOR</option>
                  <option value={Role.FAMILY} className="bg-[#111812] text-white">FAMILIA</option>
                  {currentUser?.role === Role.ADMIN && (
                    <option value={Role.ADMIN} className="bg-[#111812] text-white">ADMIN</option>
                  )}
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

      {/* Modal de Reset de Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-2">
              Resetear Contraseña
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
              Usuario: <span className="text-primary">{resettingUser?.name}</span>
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowResetModal(false);
                    setResettingUser(null);
                    setNewPassword('');
                  }} 
                  className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center"
                >
                  {resetLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                  ) : (
                    'RESETEAR'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
