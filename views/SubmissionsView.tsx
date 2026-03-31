
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../src/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { Role } from '../types';
import { Send, BookOpen, ExternalLink, CheckCircle2, Clock, X, Target, MessageSquare, Star } from 'lucide-react';

const SubmissionsView: React.FC = () => {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gradingSub, setGradingSub] = useState<any | null>(null);
  const [grade, setGrade] = useState({
    trayectoria: 20,
    explicacion: 12,
    entrega: 12,
    reflexion: 5,
  });
  const [gradingLoading, setGradingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching active mission and submissions from Firestore...');
      
      // 1. Fetch active mission
      const missionsQuery = query(collection(db, 'missions'), where('is_active', '==', true), orderBy('assign_date', 'desc'));
      const missionSnapshot = await getDocs(missionsQuery);
      if (!missionSnapshot.empty) {
        setActiveMission({ id: missionSnapshot.docs[0].id, ...missionSnapshot.docs[0].data() });
      }

      // 2. Fetch submissions
      let subQuery;
      if (user?.role === Role.STUDENT) {
        subQuery = query(collection(db, 'submissions'), where('student_id', '==', user.id), orderBy('created_at', 'desc'));
      } else {
        subQuery = query(collection(db, 'submissions'), orderBy('created_at', 'desc'));
      }
      
      const subSnapshot = await getDocs(subQuery);
      const subData = subSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as object)
      }));
      setSubmissions(subData);
      console.log('✅ Submissions loaded:', subData.length);
    } catch (err: any) {
      console.error('❌ Error fetching submissions:', err.message);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMission || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      console.log('📡 Submitting project for mission:', activeMission.id);
      const subData = {
        student_id: user.id,
        student_name: user.name,
        mission_id: activeMission.id,
        mission_title: activeMission.title,
        url,
        status: 'PENDING',
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, 'submissions'), subData);
      console.log('✅ Submission sent successfully');
      setUrl('');
      fetchData();
    } catch (err: any) {
      console.error('❌ Error submitting:', err.message);
      setError('Error al enviar la entrega: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub || !user) return;
    setGradingLoading(true);
    setError(null);
    try {
      console.log('📡 Grading submission:', gradingSub.id);
      const totalPoints = Object.values(grade).reduce((a: number, b: number) => a + b, 0);
      
      // 1. Update submission status and grade
      const subRef = doc(db, 'submissions', gradingSub.id);
      await updateDoc(subRef, {
        status: 'APPROVED',
        grade,
        total_points: totalPoints,
        graded_at: serverTimestamp(),
        graded_by: user.id
      });

      // 2. Add points to student
      await addDoc(collection(db, 'point_transactions'), {
        user_id: gradingSub.student_id,
        points: totalPoints,
        type: 'MISSION',
        mission_id: gradingSub.mission_id,
        reason: `Misión: ${gradingSub.mission_title || 'Misión Activa'}`,
        created_at: serverTimestamp(),
        created_by: user.id
      });

      // 3. Update student total XP (optional but good for performance)
      const studentRef = doc(db, 'users', gradingSub.student_id);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const currentXp = studentDoc.data().xp || 0;
        await updateDoc(studentRef, {
          xp: currentXp + totalPoints
        });
      }

      console.log('✅ Submission graded and points awarded');
      setGradingSub(null);
      fetchData();
    } catch (err: any) {
      console.error('❌ Error grading:', err.message);
      setError('Error al calificar la entrega: ' + err.message);
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black tracking-widest">Cargando entregas...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Entregas de Misión</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Proyectos</p>
        </div>
        <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
          <BookOpen className="size-8" />
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      {user?.role === Role.STUDENT && (
        <section className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">Nueva Entrega</h2>
            {activeMission ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">URL del Proyecto (GitHub / Drive)</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : <><Send className="size-4" /> ENVIAR ENTREGA</>}
                </button>
              </form>
            ) : (
              <p className="text-slate-500 text-xs font-bold uppercase text-center py-4">No hay misión activa para entregar.</p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight px-2">Mis Entregas Recientes</h2>
            {submissions.length > 0 ? (
              submissions.map((sub) => (
                <div key={sub.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl">
                      <Clock className="size-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[150px]">{sub.url}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {sub.created_at?.toDate ? sub.created_at.toDate().toLocaleDateString() : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                      sub.status === 'APPROVED' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {sub.status}
                    </span>
                    <a href={sub.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-xl transition-all">
                      <ExternalLink className="size-4 text-slate-400" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs font-bold uppercase text-center py-8">Aún no has realizado entregas.</p>
            )}
          </div>
        </section>
      )}

      {(user?.role === Role.ADMIN || user?.role === Role.TEACHER) && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-white uppercase tracking-tight px-2">Todas las Entregas</h2>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-6 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-slate-400">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{sub.student_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {sub.created_at?.toDate ? sub.created_at.toDate().toLocaleString() : 'Pendiente'}
                    </p>
                  </div>
                </div>
                  <div className="flex items-center gap-4">
                    <a href={sub.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                      Ver Proyecto <ExternalLink className="size-3" />
                    </a>
                    {sub.status === 'PENDING' && (
                      <button 
                        onClick={() => setGradingSub(sub)}
                        className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all"
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                    )}
                  </div>
              </div>
            ))}
            {submissions.length === 0 && (
              <p className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No hay entregas pendientes.</p>
            )}
          </div>
        </section>
      )}

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-tight text-white uppercase">Validar Entrega</h2>
              <button onClick={() => setGradingSub(null)} className="p-2 hover:bg-white/5 rounded-xl">
                <X className="size-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleGrade} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'trayectoria', label: 'Trayectoria (40 XP)', icon: Target, max: 40 },
                  { id: 'explicacion', label: 'Explicación (25 XP)', icon: MessageSquare, max: 25 },
                  { id: 'entrega', label: 'Entrega (25 XP)', icon: BookOpen, max: 25 },
                  { id: 'reflexion', label: 'Reflexión (10 XP)', icon: Star, max: 10 },
                ].map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="size-3 text-primary" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-primary">{(grade as any)[item.id]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      step="1"
                      value={(grade as any)[item.id]}
                      onChange={(e) => setGrade({ ...grade, [item.id]: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all text-xs"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={gradingLoading}
                  className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {gradingLoading ? 'VALIDANDO...' : <><CheckCircle2 className="size-4" /> VALIDAR</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsView;
