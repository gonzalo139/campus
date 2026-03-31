
import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { Alert } from '../types';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/errorService';

const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(alertsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'alerts');
    });

    return () => unsubscribe();
  }, []);

  const filteredAlerts = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando sistema de alertas...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Centro de Alertas</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Monitoreo de Riesgo</p>
        </div>
        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl">
          <ShieldCheck className="size-8" />
        </div>
      </section>

      {/* Filters */}
      <section className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filter === f 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
            }`}
          >
            {f === 'ALL' ? 'Todas' : f === 'HIGH' ? 'Alta' : f === 'MEDIUM' ? 'Media' : 'Baja'}
          </button>
        ))}
      </section>

      {/* Alerts List */}
      <section className="flex flex-col gap-4">
        {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-start gap-4 hover:bg-white/10 transition-all group cursor-pointer">
            <div className={`p-3 rounded-2xl ${
              alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : 
              alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {alert.severity === 'HIGH' ? <AlertCircle className="size-6" /> : 
               alert.severity === 'MEDIUM' ? <AlertTriangle className="size-6" /> : <Info className="size-6" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{alert.student_name}</h3>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{alert.date}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">{alert.message}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-2 py-1 rounded-lg border ${
                  alert.type === 'ATTENDANCE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
                  alert.type === 'PERFORMANCE' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                }`}>
                  {alert.type}
                </span>
                <span className={`text-[8px] font-black px-2 py-1 rounded-lg border ${
                  alert.severity === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                  alert.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-800/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                }`}>
                  PRIORIDAD {alert.severity}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-700 group-hover:text-white transition-all self-center" />
          </div>
        )) : (
          <div className="py-20 text-center">
            <ShieldCheck className="size-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No se encontraron alertas críticas</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AlertsView;
