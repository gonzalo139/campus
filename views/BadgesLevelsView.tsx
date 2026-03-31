
import React, { useState, useEffect } from 'react';
import { db, auth } from '../src/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import { Role } from '../types';
import { Award, Star, TrendingUp, Plus, Shield, Zap } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../services/errorService';

const BadgesLevelsView: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [studentBadges, setStudentBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: 'award' });
  const [error, setError] = useState<string | null>(null);
  const [debugStatus, setDebugStatus] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 BadgesLevelsView mounted. Current user:', auth.currentUser?.uid, 'Email:', auth.currentUser?.email);
    fetchData();
    runDebugWrite();
  }, [user]);

  const runDebugWrite = async () => {
    try {
      console.log('🧪 Running debug write test...');
      const debugRef = await addDoc(collection(db, 'debug'), {
        test: true,
        timestamp: Date.now(),
        user_uid: auth.currentUser?.uid || 'anonymous'
      });
      console.log('✅ Debug write successful! Doc ID:', debugRef.id);
      setDebugStatus('Debug write OK');
    } catch (err: any) {
      console.error('❌ Debug write FAILED:', err.code, err.message);
      setDebugStatus(`Debug write FAILED: ${err.code}`);
      // We don't use handleFirestoreError here to avoid throwing and hitting ErrorBoundary
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log('🚀 Attempting to create badge:', newBadge);
    
    if (!auth.currentUser) {
      const msg = '❌ ERROR: No hay usuario autenticado en Firebase Auth.';
      console.error(msg);
      setError(msg);
      return;
    }

    console.log('👤 Active UID for write:', auth.currentUser.uid);

    try {
      const badgeData = {
        ...newBadge,
        created_at: serverTimestamp(),
      };
      
      console.log('📡 Sending addDoc to collection "badges" with data:', badgeData);
      
      const docRef = await addDoc(collection(db, 'badges'), badgeData);
      
      console.log('✅ Badge created successfully with ID:', docRef.id);
      
      fetchData();
      setShowBadgeModal(false);
      setNewBadge({ name: '', description: '', icon: 'award' });
    } catch (err: any) {
      console.error('❌ Error creating badge (addDoc failed):', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'badges');
      } catch (finalError: any) {
        setError(`Error al crear la insignia: ${finalError.message}`);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching data from Firestore...');
      
      // Fetch Levels
      console.log('📡 Fetching levels...');
      const levelsQuery = query(collection(db, 'levels'), orderBy('level', 'asc'));
      const levelsSnapshot = await getDocs(levelsQuery);
      const levelsData = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLevels(levelsData);
      console.log(`✅ Fetched ${levelsData.length} levels.`);

      // Fetch Badges
      console.log('📡 Fetching badges...');
      const badgesQuery = query(collection(db, 'badges'), orderBy('name', 'asc'));
      const badgesSnapshot = await getDocs(badgesQuery);
      const badgesData = badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBadges(badgesData);
      console.log(`✅ Fetched ${badgesData.length} badges.`);
      
      // Fetch Student Badges if applicable
      if (user?.uid) {
        console.log('📡 Fetching student badges for user:', user.uid);
        const studentBadgesQuery = query(collection(db, 'student_badges'), where('student_id', '==', user.uid));
        const studentBadgesSnapshot = await getDocs(studentBadgesQuery);
        const studentBadgesData = studentBadgesSnapshot.docs.map(doc => doc.data());
        setStudentBadges(studentBadgesData);
        console.log(`✅ Fetched ${studentBadgesData.length} student badges.`);
      }
    } catch (err: any) {
      console.error('❌ Error fetching data (getDocs failed):', err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'badges/levels');
      } catch (finalError: any) {
        setError(`Error al cargar datos: ${finalError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando gamificación...</div>;

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gamificación</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Insignias y Niveles de Progresión</p>
          <div className="flex gap-2 mt-2">
            {debugStatus && (
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg inline-block ${debugStatus.includes('OK') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {debugStatus}
              </span>
            )}
            <button 
              onClick={runDebugWrite}
              className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-all"
            >
              Test Write
            </button>
            <button 
              onClick={fetchData}
              className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-all"
            >
              Retry Fetch
            </button>
          </div>
        </div>
        {user?.role === Role.ADMIN && (
          <button 
            onClick={() => setShowBadgeModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all"
          >
            <Plus className="size-5" />
            <span className="text-xs font-black uppercase tracking-tight">Nueva Insignia</span>
          </button>
        )}
      </section>

      {showBadgeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111812] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-white uppercase mb-6">Nueva Insignia</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBadge} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
                <input
                  type="text"
                  required
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción</label>
                <textarea
                  required
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBadgeModal(false)} className="flex-1 bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-all">CANCELAR</button>
                <button type="submit" className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all">CREAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Levels Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-lg font-black tracking-tight text-white uppercase">Sistema de Niveles</h2>
          <TrendingUp className="size-5 text-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.isArray(levels) && levels.map((lvl) => (
            <div key={lvl.id} className={`p-6 rounded-3xl border transition-all ${user?.level === lvl.level ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-primary font-black">
                  {lvl.level}
                </div>
                {user?.level === lvl.level && <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">Nivel Actual</span>}
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">{lvl.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{lvl.min_xp} XP Requeridos</p>
            </div>
          ))}
        </div>
      </section>

      {/* Badges Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-lg font-black tracking-tight text-white uppercase">Insignias Disponibles</h2>
          <Award className="size-5 text-amber-500" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.isArray(badges) && badges.map((badge) => {
            const earned = Array.isArray(studentBadges) && studentBadges.some(sb => sb.badge_id === badge.id);
            return (
              <div key={badge.id} className={`flex flex-col items-center text-center p-6 rounded-3xl border transition-all ${earned ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                <div className={`size-16 rounded-2xl flex items-center justify-center mb-4 ${earned ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-600'}`}>
                  <Award className="size-8" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-tight mb-1">{badge.name}</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{badge.description}</p>
                {earned && <div className="mt-3 text-[8px] font-black text-amber-500 uppercase tracking-widest">¡Conseguida!</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default BadgesLevelsView;
