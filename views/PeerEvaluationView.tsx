
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../src/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Role } from '../types';
import { ShieldCheck, MessageSquare, Send, AlertCircle, CheckCircle2, Users, Target, BookOpen } from 'lucide-react';

const PeerEvaluationView: React.FC = () => {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [scores, setScores] = useState({
    role_score: 5,
    teamwork_score: 5,
    documentation_score: 5,
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching active mission and students for evaluation...');
      
      // 1. Fetch active mission
      const missionsQuery = query(collection(db, 'missions'), where('is_active', '==', true), orderBy('assign_date', 'desc'), limit(1));
      const missionSnapshot = await getDocs(missionsQuery);
      if (!missionSnapshot.empty) {
        setActiveMission({ id: missionSnapshot.docs[0].id, ...missionSnapshot.docs[0].data() });
      }

      // 2. Fetch students (excluding current user)
      const studentsQuery = query(
        collection(db, 'users'), 
        where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]),
        limit(100)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => s.id !== user?.id);
      
      setStudents(studentsData);
      console.log('✅ Data loaded:', { mission: !!missionSnapshot.empty ? 'None' : 'Active', students: studentsData.length });
    } catch (err: any) {
      console.error('❌ Error fetching evaluation data:', err.message);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMission || !selectedStudent || !user) return;

    setSubmitting(true);
    setError(null);
    try {
      console.log('📡 Submitting peer evaluation for student:', selectedStudent);
      
      const evaluationData = {
        evaluator_id: user.id,
        evaluator_name: user.name,
        evaluated_id: selectedStudent,
        mission_id: activeMission.id,
        mission_title: activeMission.title,
        ...scores,
        comments,
        created_at: serverTimestamp(),
      };

      await addDoc(collection(db, 'peer_evaluations'), evaluationData);
      
      // Award points for evaluating (responsibility points)
      await addDoc(collection(db, 'point_transactions'), {
        user_id: user.id,
        points: 5,
        type: 'PEER_EVALUATION',
        reason: `Evaluación de pares: ${activeMission.title}`,
        created_at: serverTimestamp(),
      });

      console.log('✅ Peer evaluation submitted successfully');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedStudent('');
        setComments('');
        setScores({ role_score: 5, teamwork_score: 5, documentation_score: 5 });
      }, 3000);
    } catch (err: any) {
      console.error('❌ Error submitting evaluation:', err.message);
      setError('Error al enviar la evaluación: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black tracking-widest">Cargando sistema de evaluación...</div>;

  if (!activeMission) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <AlertCircle className="size-16 text-slate-600 mb-6" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Evaluación Cerrada</h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest max-w-xs">
          Solo puedes evaluar a tus compañeros cuando hay una misión activa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Evaluación entre Pares</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Misión: {activeMission.title}</p>
        </div>
        <div className="p-4 bg-primary/10 text-primary rounded-2xl">
          <ShieldCheck className="size-8" />
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-primary/10 border border-primary/20 p-12 rounded-[2.5rem] flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="size-20 text-primary mb-6 animate-bounce" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">¡Evaluación Enviada!</h3>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest max-w-xs">
            Gracias por tu honestidad. Tus puntos de responsabilidad han sido actualizados.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Student Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Compañero a Evaluar</label>
            <select
              required
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none text-white font-bold"
            >
              <option value="" className="bg-[#111812]">Seleccionar compañero...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#111812]">
                  {s.name || s.email}
                </option>
              ))}
            </select>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-1 gap-6">
            {[
              { id: 'role_score', label: 'Rol en el Equipo', icon: Target, max: 10 },
              { id: 'teamwork_score', label: 'Trabajo en Equipo', icon: Users, max: 10 },
              { id: 'documentation_score', label: 'Documentación', icon: BookOpen, max: 10 },
            ].map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="size-4 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-xl font-black text-primary">{(scores as any)[item.id]} <span className="text-[10px] text-slate-600">/ {item.max}</span></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={item.max}
                  step="1"
                  value={(scores as any)[item.id]}
                  onChange={(e) => setScores({ ...scores, [item.id]: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                  <span>0 pts</span>
                  <span>{item.max} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Comentarios Constructivos</label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 size-4 text-slate-500" />
              <textarea
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all min-h-[120px]"
                placeholder="¿Qué hizo bien? ¿Qué puede mejorar?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedStudent}
            className="w-full bg-primary text-black font-black py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black"></div>
            ) : (
              <>
                <Send className="size-5" />
                ENVIAR EVALUACIÓN
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default PeerEvaluationView;
