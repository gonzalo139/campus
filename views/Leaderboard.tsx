
import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Role } from '../types';
import { Trophy, Search } from 'lucide-react';
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

const Leaderboard: React.FC = () => {
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]),
      orderBy('total_points', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando ranking global...</div>;

  const filteredRanking = ranking.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = ranking.slice(0, 3);
  const displayRanking = searchTerm ? filteredRanking : filteredRanking.slice(3);

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Ranking Global</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Los mejores del Campus48</p>
        </div>
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
          <Trophy className="size-8" />
        </div>
      </section>

      {/* Top 3 Podium - Only show when not searching */}
      {!searchTerm && topThree.length > 0 && (
        <section className="grid grid-cols-3 gap-4 items-end mb-8 h-64">
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[1]?.email}`} className="size-16 rounded-2xl border-2 border-slate-400/50" alt="2nd" />
              <div className="absolute -bottom-2 -right-2 size-6 bg-slate-400 text-black rounded-lg flex items-center justify-center font-black text-xs">2</div>
            </div>
            <div className="w-full bg-slate-400/10 border-t-4 border-slate-400 h-24 rounded-t-2xl flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-slate-100 truncate w-full text-center uppercase">{topThree[1]?.name}</span>
              <span className="text-xs font-black text-slate-400">{topThree[1]?.total_points} XP</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[0]?.email}`} className="size-20 rounded-2xl border-4 border-amber-500 shadow-2xl shadow-amber-500/20" alt="1st" />
              <div className="absolute -bottom-2 -right-2 size-8 bg-amber-500 text-black rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-amber-500/20">1</div>
            </div>
            <div className="w-full bg-amber-500/10 border-t-8 border-amber-500 h-32 rounded-t-2xl flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-slate-100 truncate w-full text-center uppercase">{topThree[0]?.name}</span>
              <span className="text-sm font-black text-amber-500">{topThree[0]?.total_points} XP</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[2]?.email}`} className="size-16 rounded-2xl border-2 border-amber-800/50" alt="3rd" />
              <div className="absolute -bottom-2 -right-2 size-6 bg-amber-800 text-white rounded-lg flex items-center justify-center font-black text-xs">3</div>
            </div>
            <div className="w-full bg-amber-800/10 border-t-4 border-amber-800 h-20 rounded-t-2xl flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-slate-100 truncate w-full text-center uppercase">{topThree[2]?.name}</span>
              <span className="text-xs font-black text-amber-800">{topThree[2]?.total_points} XP</span>
            </div>
          </div>
        </section>
      )}

      {/* Search & List */}
      <section>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          {displayRanking.map((entry) => {
            const globalRank = ranking.findIndex(r => r.student_id === entry.student_id) + 1;
            return (
              <div 
                key={entry.student_id}
                className="flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-slate-500 w-6">#{globalRank}</span>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.email}`} className="size-10 rounded-xl border border-white/10" alt="User" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{entry.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {entry.email.endsWith('@campus48.local') ? entry.email.split('@')[0] : entry.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-primary">{entry.total_points}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">XP</span>
                </div>
              </div>
            );
          })}
          {displayRanking.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              No se encontraron resultados
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
