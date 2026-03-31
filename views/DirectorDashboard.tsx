
import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { Users, Trophy, AlertCircle, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

interface DirectorDashboardProps {
  setTab: (tab: string) => void;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ setTab }) => {
  const [analytics, setAnalytics] = useState<any>({
    total_students: 0,
    average_attendance: 85,
    dropout_risk: 12,
    course_performance: [
      { name: '1er Año', xp: 450 },
      { name: '2do Año', xp: 780 },
      { name: '3er Año', xp: 620 }
    ]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Total students listener
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE])
    );

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setAnalytics((prev: any) => ({
        ...prev,
        total_students: snapshot.size
      }));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching students for director:', error);
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
      unsubscribeStudents();
      clearTimeout(safetyTimeout);
    };
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando métricas globales...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Métricas Globales</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Panel de Dirección</p>
        </div>
        <div className="p-4 bg-primary/10 text-primary rounded-2xl">
          <TrendingUp className="size-8" />
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Users className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Alumnos</span>
          </div>
          <p className="text-2xl font-black text-white">{analytics.total_students}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500">
            <BarChart3 className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Asistencia Promedio</span>
          </div>
          <p className="text-2xl font-black text-white">{analytics.average_attendance}%</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2 col-span-2">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Riesgo de Deserción</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-white">{analytics.dropout_risk}%</p>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${analytics.dropout_risk}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Course Performance */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black tracking-tight text-white">Rendimiento por Curso</h2>
          <Trophy className="size-5 text-slate-500" />
        </div>
        <div className="flex flex-col gap-3">
          {analytics.course_performance.map((course: any, i: number) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{course.name}</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Promedio XP: {course.xp}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(course.xp / 1000) * 100}%` }} />
                </div>
                <ChevronRight className="size-4 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-3">
        <button 
          onClick={() => setTab('attendance')}
          className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Users className="size-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Pasar Lista</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Control de asistencia campus</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        <button className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <BarChart3 className="size-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Reportes Detallados</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Descargar analíticas del campus</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-600 group-hover:text-primary transition-all" />
        </button>
      </section>
    </div>
  );
};

export default DirectorDashboard;
