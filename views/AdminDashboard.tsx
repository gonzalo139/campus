
import React, { useState, useEffect } from 'react';
import { Mission, LeaderboardEntry, Role } from '../types';
import { Plus, Target, Edit2, Trash2, Users, GraduationCap } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

interface AdminDashboardProps {
  setTab: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setTab }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    max_xp: 100,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    
    // Fetch missions
    const qMissions = query(collection(db, 'missions'), where('year', '==', currentYear));
    const unsubscribeMissions = onSnapshot(qMissions, (snapshot) => {
      const missionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMissions(missionsList);
    }, (error) => {
      console.error('Error fetching missions:', error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'missions');
      } catch (e) {
        // Error logged
      }
    });

    // Fetch leaderboard (assuming total_points is on user doc)
    const qLeaderboard = query(
      collection(db, 'users'), 
      where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]),
      orderBy('total_points', 'desc'),
      limit(10)
    );
    const unsubscribeLeaderboard = onSnapshot(qLeaderboard, (snapshot) => {
      const leaderboardList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          student_id: doc.id,
          name: data.name,
          email: data.email,
          total_points: data.total_points || 0
        };
      });
      setRanking(leaderboardList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'users');
      } catch (e) {
        // Error logged
      }
    });

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribeMissions();
      unsubscribeLeaderboard();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'missions', editingId), {
          ...newMission,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'missions'), {
          ...newMission,
          is_active: false,
          created_at: serverTimestamp()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving mission:', error);
      alert('Error al guardar la misión');
    }
  };

  const handleEditMission = (mission: any) => {
    setEditingId(mission.id);
    setNewMission({
      title: mission.title,
      description: mission.description,
      max_xp: mission.max_xp,
      year: mission.year
    });
    setShowCreateModal(true);
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta misión?')) return;
    try {
      await deleteDoc(doc(db, 'missions', id));
    } catch (error) {
      console.error('Error deleting mission:', error);
      alert('Error al eliminar la misión');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingId(null);
    setNewMission({ title: '', description: '', max_xp: 100, year: new Date().getFullYear() });
  };

  const handleActivateMission = async (id: string) => {
    try {
      // 1. Deactivate all other active missions for the current year
      const currentYear = new Date().getFullYear();
      const activeMissionsQuery = query(
        collection(db, 'missions'), 
        where('year', '==', currentYear),
        where('is_active', '==', true)
      );
      const activeMissionsSnapshot = await getDocs(activeMissionsQuery);
      
      const deactivationPromises = activeMissionsSnapshot.docs.map(missionDoc => 
        updateDoc(doc(db, 'missions', missionDoc.id), {
          is_active: false,
          updated_at: serverTimestamp()
        })
      );
      
      await Promise.all(deactivationPromises);

      // 2. Activate the selected mission
      await updateDoc(doc(db, 'missions', id), {
        is_active: true,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error activating mission:', error);
      alert('Error al activar la misión');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando panel administrativo...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      {/* Header */}
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Panel de Administración</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Misiones y Usuarios</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-xs font-black uppercase tracking-tight">Crear Misión</span>
        </button>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setTab('assignments')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all w-full"
        >
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Users className="size-6" />
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-tight">Asignar Docentes</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gestionar equipo académico</p>
        </button>

        <button 
          onClick={() => setTab('student-assignments')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all w-full"
        >
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <GraduationCap className="size-6" />
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-tight">Asignar Estudiantes</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Vincular alumnos a cursos</p>
        </button>
      </section>

      {/* Missions List */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Misiones del Año</h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Año {new Date().getFullYear()}</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {missions.map((mission: any) => (
            <div 
              key={mission.id}
              className={`p-6 rounded-3xl border transition-all ${
                mission.is_active 
                  ? 'bg-primary/5 border-primary/20 shadow-xl shadow-primary/5' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white mb-1">{mission.title}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{mission.max_xp} XP Máx</p>
                </div>
                <div className="flex items-center gap-4">
                  {mission.is_active ? (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">MISIÓN ASIGNADA (ACTIVA)</span>
                  ) : (
                    <button 
                      onClick={() => handleActivateMission(mission.id)}
                      className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-all uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-xl hover:border-primary/50"
                    >
                      <Target className="size-3" />
                      Asignar Misión
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditMission(mission)}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMission(mission.id)}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {mission.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Global Ranking Preview */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Ranking Global</h2>
          <button 
            onClick={() => setTab('leaderboard')}
            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
          >
            Ver Todo
          </button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          {ranking.slice(0, 5).map((entry, i) => (
            <div 
              key={entry.student_id}
              className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 ${
                i === 0 ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-sm font-black w-6 ${
                  i === 0 ? 'text-primary' : 'text-slate-500'
                }`}>#{i + 1}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{entry.name || (entry.email.endsWith('@campus48.local') ? entry.email.split('@')[0] : entry.email)}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {entry.email.endsWith('@campus48.local') ? entry.email.split('@')[0] : entry.email}
                  </span>
                </div>
              </div>
              <span className="text-sm font-black text-primary">{entry.total_points} XP</span>
            </div>
          ))}
        </div>
      </section>

      {/* Create Mission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">Nueva Misión</h2>
            <form onSubmit={handleCreateMission} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título</label>
                <input
                  type="text"
                  required
                  value={newMission.title}
                  onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Nombre de la misión"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción</label>
                <textarea
                  required
                  value={newMission.description}
                  onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all min-h-[100px]"
                  placeholder="Objetivos de la misión..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">XP Máximo</label>
                  <input
                    type="number"
                    required
                    value={newMission.max_xp}
                    onChange={(e) => setNewMission({ ...newMission, max_xp: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Año</label>
                  <input
                    type="number"
                    required
                    value={newMission.year}
                    onChange={(e) => setNewMission({ ...newMission, year: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
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

export default AdminDashboard;
