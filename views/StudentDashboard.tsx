
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Mission, LeaderboardEntry, Role } from '../types';
import { Trophy, Target, Star, ChevronRight, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';

import { handleFirestoreError, OperationType } from '../services/errorService';

interface StudentDashboardProps {
  setTab: (tab: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ setTab }) => {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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
        setActiveMission({ id: doc.id, ...doc.data() } as Mission);
      } else {
        setActiveMission(null);
      }
    }, (error) => {
      console.error('📡 Firestore: FAIL - onSnapshot(missions):', error.code, error.message);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'missions');
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
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {
        // Error logged
      }
    });

    return () => {
      unsubscribeMission();
      unsubscribeLeaderboard();
    };
  }, [user]);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando tu progreso...</div>;

  const userRankIndex = ranking.findIndex(r => r.student_id === user?.id);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : '-';

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      {/* Stats Quick Cards */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Star className="size-4" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white">{(user?.total_points || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Trophy className="size-4" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white">#{userRank}</p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Trophy className="size-4" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white">{user?.level || 1}</p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Star className="size-4" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insignias</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white">4</p>
        </div>
      </section>

      {/* Active Mission */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-black tracking-tight text-white">Misión Activa</h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg animate-pulse">EN CURSO</span>
        </div>
        
        {activeMission ? (
          <div className="bg-gradient-to-br from-primary/20 to-emerald-500/5 p-8 rounded-[2.5rem] border border-primary/20 shadow-2xl shadow-primary/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white mb-1">{activeMission.title}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Año {activeMission.year} • {activeMission.max_xp} XP Máx</p>
                </div>
                <div className="p-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20">
                  <Target className="size-8" />
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed mb-8 font-medium">
                {activeMission.description}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(25,230,94,0.4)] transition-all duration-1000" style={{ width: '65%' }} />
                </div>
                <span className="text-xs font-black text-primary">65%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Progreso de la misión</p>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[2.5rem] flex flex-col items-center text-center">
            <AlertCircle className="size-12 text-slate-600 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hay misiones activas</p>
            <p className="text-xs text-slate-500 mt-2">Espera a que un administrador active el próximo desafío.</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setTab('attendance')}
          className="flex flex-col items-center justify-center bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group gap-3"
        >
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
            <Calendar className="size-6" />
          </div>
          <div className="text-center">
            <p className="font-black text-white text-[10px] uppercase tracking-tight">Mi Asistencia</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Revisa tus faltas</p>
          </div>
        </button>
      </section>

      {/* Evaluation Quick Action */}
      <section className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setTab('evaluations')}
          className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-sm uppercase tracking-tight">Evaluación entre Pares</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Evalúa a tus compañeros de equipo</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>
      </section>
    </div>
  );
};

export default StudentDashboard;
