
import React, { useState, useEffect } from 'react';
import { Mission, LeaderboardEntry, Role } from '../types';
import { Plus, Target, ChevronRight, AlertCircle, Users, Search } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

interface TeacherDashboardProps {
  setTab: (tab: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ setTab }) => {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [pointsData, setPointsData] = useState({
    amount: 10,
    reason: '',
    missionId: ''
  });
  const [pointsLoading, setPointsLoading] = useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    
    // Mission listener
    const missionQuery = query(
      collection(db, 'missions'),
      where('year', '==', currentYear),
      where('is_active', '==', true),
      limit(1)
    );

    console.log('📡 Firestore: START - onSnapshot(missions)');
    const unsubscribeMission = onSnapshot(missionQuery, (snapshot) => {
      console.log('📡 Firestore: SUCCESS - onSnapshot(missions) update.');
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const mission = { id: doc.id, ...doc.data() } as Mission;
        setActiveMission(mission);
        setPointsData(prev => ({ ...prev, missionId: mission.id }));
      } else {
        setActiveMission(null);
      }
    }, (error) => {
      console.error('📡 Firestore: FAIL - onSnapshot(missions):', error.code, error.message);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'missions');
      } catch (e) {
        // Error logged
      }
    });

    // Leaderboard listener
    const leaderboardQuery = query(
      collection(db, 'users'),
      where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]),
      orderBy('total_points', 'desc'),
      limit(100)
    );

    console.log('📡 Firestore: START - onSnapshot(users/leaderboard)');
    const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
      console.log('📡 Firestore: SUCCESS - onSnapshot(users/leaderboard) update.');
      const leaderboardList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          student_id: doc.id,
          name: data.name || data.email.split('@')[0],
          email: data.email,
          total_points: data.total_points || 0
        };
      });
      setRanking(leaderboardList);
      setLoading(false);
    }, (error) => {
      console.error('📡 Firestore: FAIL - onSnapshot(users/leaderboard):', error.code, error.message);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'users');
      } catch (e) {
        // Error logged
      }
    });

    return () => {
      unsubscribeMission();
      unsubscribeLeaderboard();
    };
  }, []);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setPointsLoading(true);
    try {
      // 1. Add point transaction
      await addDoc(collection(db, 'point_transactions'), {
        user_id: selectedStudent.student_id,
        points: pointsData.amount,
        reason: pointsData.reason,
        mission_id: pointsData.missionId,
        created_at: serverTimestamp()
      });

      // 2. Update student total points
      const studentRef = doc(db, 'users', selectedStudent.student_id);
      await updateDoc(studentRef, {
        total_points: increment(pointsData.amount)
      });

      setShowPointsModal(false);
      setPointsData({ ...pointsData, reason: '' });
    } catch (error) {
      console.error('Error adding points:', error);
      alert('Error al asignar puntos');
    } finally {
      setPointsLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando panel docente...</div>;

  const filteredRanking = ranking.filter(r => 
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      {/* Active Mission Card */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-black tracking-tight text-white">Misión Activa</h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">PROFESOR</span>
        </div>
        
        {activeMission ? (
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white mb-1">{activeMission.title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Año {activeMission.year} • {activeMission.max_xp} XP Máx</p>
              </div>
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Target className="size-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">
              {activeMission.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '45%' }} />
              </div>
              <span className="text-[10px] font-black text-slate-500">45% COMPLETADO</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[2.5rem] flex flex-col items-center text-center">
            <AlertCircle className="size-12 text-slate-600 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Sin misión activa</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setTab('attendance')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all w-full"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Users className="size-6" />
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-tight">Pasar Lista</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Control de asistencia diario</p>
        </button>
      </section>

      {/* Risk Alerts Preview */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Alertas de Riesgo</h2>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">2 CRÍTICAS</span>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between hover:bg-red-500/10 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Juan Pérez</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">3 inasistencias consecutivas</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-700" />
        </div>
      </section>

      {/* Student Management / Ranking */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Estado de Estudiantes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary/50 transition-all w-40 md:w-64"
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_80px_60px] p-4 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pos</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estudiante</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">XP</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acción</span>
          </div>
          {filteredRanking.map((entry, index) => (
            <div 
              key={entry.student_id}
              className="grid grid-cols-[50px_1fr_80px_60px] items-center p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all"
            >
              <span className="text-sm font-black text-slate-500">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{entry.name}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  {entry.email.endsWith('@campus48.local') ? entry.email.split('@')[0] : entry.email}
                </span>
              </div>
              <span className="text-sm font-black text-primary text-right">{entry.total_points}</span>
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    setSelectedStudent(entry);
                    setShowPointsModal(true);
                  }}
                  className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black transition-all"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredRanking.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              No se encontraron estudiantes
            </div>
          )}
        </div>
      </section>

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-2">Asignar Puntos</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Para: {selectedStudent.name}</p>
            
            <form onSubmit={handleAddPoints} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Misión</label>
                <select
                  required
                  value={pointsData.missionId}
                  onChange={(e) => setPointsData({ ...pointsData, missionId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none text-white font-bold"
                >
                  <option value="" disabled>Seleccionar misión...</option>
                  {activeMission && <option value={activeMission.id}>{activeMission.title}</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cantidad de XP</label>
                <input
                  type="number"
                  required
                  value={pointsData.amount}
                  onChange={(e) => setPointsData({ ...pointsData, amount: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Motivo / Razón</label>
                <input
                  type="text"
                  required
                  value={pointsData.reason}
                  onChange={(e) => setPointsData({ ...pointsData, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Ej: Excelente participación"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={pointsLoading}
                  className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center"
                >
                  {pointsLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div> : 'ASIGNAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
