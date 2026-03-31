
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { ShieldCheck, Trophy, AlertCircle, Clock, ChevronRight, Users } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  doc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

interface FamilyDashboardProps {
  setTab: (tab: string) => void;
}

const FamilyDashboard: React.FC<FamilyDashboardProps> = ({ setTab }) => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.student_id) {
      setLoading(false);
      return;
    }

    // 1. Student profile listener
    const unsubscribeStudent = onSnapshot(doc(db, 'users', user.student_id), (docSnap) => {
      if (docSnap.exists()) {
        setStudentData({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching student for family:', error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, `users/${user.student_id}`);
      } catch (e) {
        // Error logged
      }
    });

    // 2. Alerts listener
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('student_id', '==', user.student_id),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alertsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(alertsList);
    }, (error) => {
      console.error('Error fetching alerts for family:', error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'alerts');
      } catch (e) {
        // Error logged
      }
    });

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribeStudent();
      unsubscribeAlerts();
      clearTimeout(safetyTimeout);
    };
  }, [user]);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando datos familiares...</div>;
  if (!studentData) return <div className="p-10 text-center">No se encontraron datos del estudiante vinculado.</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Progreso de {studentData.name}</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Panel de Familia</p>
        </div>
        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <img src={studentData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.email}`} alt="Avatar" className="size-full object-cover" />
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Total XP</span>
          </div>
          <p className="text-2xl font-black text-white">{studentData.total_points || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Users className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Asistencia</span>
          </div>
          <p className="text-2xl font-black text-white">92%</p>
        </div>
      </section>

      {/* Alerts Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Alertas Recientes</h2>
          <ShieldCheck className="size-5 text-slate-500" />
        </div>
        <div className="flex flex-col gap-3">
          {alerts.length > 0 ? alerts.map((alert: any) => (
            <div key={alert.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-4">
              <div className={`p-2 rounded-xl ${
                alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : 
                alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                <AlertCircle className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">{alert.message}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{alert.date}</p>
              </div>
            </div>
          )) : (
            <p className="text-slate-500 text-xs font-bold uppercase text-center py-4">Sin alertas pendientes.</p>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 gap-3">
        <button className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Clock className="size-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Historial de Misiones</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ver entregas y calificaciones</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-600 group-hover:text-primary transition-all" />
        </button>
      </section>
    </div>
  );
};

export default FamilyDashboard;
