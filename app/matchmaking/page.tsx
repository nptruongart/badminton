"use client";
import { useState, useEffect } from "react";

interface Player { name: string; elo: number; wins: number; losses: number; winstreak?: number; }

export default function MatchmakingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [presentPlayers, setPresentPlayers] = useState<string[]>([]);
  
  const [matches, setMatches] = useState<{ team1: string[], team2: string[], court: string }[]>([]);
  const [sittingOut, setSittingOut] = useState<string[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<string[]>([]);
  const [historyPairs, setHistoryPairs] = useState<Record<string, number>>({});
  
  const [courts, setCourts] = useState<string[]>(["Sân 1", "Sân 2"]);
  const [newCourt, setNewCourt] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    setPlayers(savedPlayers);
    setPresentPlayers(savedPlayers.map((p: Player) => p.name));
    const savedCourts = JSON.parse(localStorage.getItem("cyber_courts") || '["Sân 1", "Sân 2"]');
    setCourts(savedCourts);
    const savedMatches = localStorage.getItem("savedCurrentMatches");
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    setIsLoaded(true);
  }, []);

  const handleAddCourt = () => {
    if (!newCourt.trim() || courts.includes(newCourt.trim())) return;
    const updated = [...courts, newCourt.trim()];
    setCourts(updated); localStorage.setItem("cyber_courts", JSON.stringify(updated));
    setNewCourt("");
  };

  const handleRemoveCourt = (c: string) => {
    const updated = courts.filter(court => court !== c);
    setCourts(updated); localStorage.setItem("cyber_courts", JSON.stringify(updated));
  };

  const handleAddPlayer = () => {
    if (!newPlayer.trim()) return;
    const name = newPlayer.trim();
    if (players.some(p => p.name === name)) return alert("⚠️ TÊN ĐÃ TỒN TẠI!");
    const newP = { name, elo: 1000, wins: 0, losses: 0, winstreak: 0 };
    const updated = [...players, newP];
    setPlayers(updated); setPresentPlayers([...presentPlayers, name]);
    localStorage.setItem("cyber_players", JSON.stringify(updated));
    setNewPlayer("");
  };

  const renamePlayer = (oldName: string) => {
    const newName = prompt(`Sửa tên tay vợt [ ${oldName} ]:`, oldName);
    if (!newName || newName.trim() === "" || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    if (players.some(p => p.name === trimmed)) return alert("⚠️ TÊN NÀY ĐÃ CÓ NGƯỜI SỬ DỤNG!");
    const updated = players.map(p => p.name === oldName ? { ...p, name: trimmed } : p);
    setPlayers(updated); localStorage.setItem("cyber_players", JSON.stringify(updated));
    if (presentPlayers.includes(oldName)) {
      setPresentPlayers(presentPlayers.map(n => n === oldName ? trimmed : n));
    }
  };

  const toggleAttendance = (name: string) => {
    if (presentPlayers.includes(name)) {
      setPresentPlayers(presentPlayers.filter(n => n !== name));
      setWaitingQueue(waitingQueue.filter(n => n !== name));
    } else {
      setPresentPlayers([...presentPlayers, name]);
    }
  };

  const generateFairMatches = () => {
    if (presentPlayers.length < 4) return alert("WARNING: CẦN ÍT NHẤT 4 TAY VỢT!");
    if (courts.length === 0) return alert("WARNING: CHƯA CÓ SÂN NÀO!");

    const activeNames = presentPlayers;
    const sortedNames = [...activeNames].sort((a, b) => {
      const indexA = waitingQueue.indexOf(a); const indexB = waitingQueue.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1; if (indexB !== -1) return 1; return 0;
    });

    const playerObjects = sortedNames.map(name => {
      const p = players.find(x => x.name === name) || { name, elo: 1000, wins: 0, losses: 0 };
      const total = p.wins + p.losses; const winRate = total > 0 ? p.wins / total : 0.5;
      return { ...p, powerScore: p.elo + winRate * 200 };
    });

    const rawMatches: { team1: string[], team2: string[] }[] = [];
    let pool = [...playerObjects];
    const playedThisRound: string[] = [];

    while (pool.length >= 4) {
      const p1 = pool.shift()!;
      let bestPartnerIdx = 0; let minScore = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const partner = pool[i];
        const pairKey = [p1.name, partner.name].sort().join("-");
        const timesPlayedTogether = historyPairs[pairKey] || 0;
        const score = timesPlayedTogether * 150 + Math.abs(p1.powerScore - partner.powerScore);
        if (score < minScore) { minScore = score; bestPartnerIdx = i; }
      }
      const p2 = pool.splice(bestPartnerIdx, 1)[0];
      const team1 = [p1.name, p2.name]; const team1Power = p1.powerScore + p2.powerScore;

      let bestIndices = [0, 1]; let minDiff = Infinity;
      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          const diff = Math.abs(team1Power - (pool[i].powerScore + pool[j].powerScore));
          if (diff < minDiff) { minDiff = diff; bestIndices = [i, j]; }
        }
      }
      const o2 = pool.splice(bestIndices[1], 1)[0]; const o1 = pool.splice(bestIndices[0], 1)[0];
      const team2 = [o1.name, o2.name];
      rawMatches.push({ team1, team2 }); playedThisRound.push(p1.name, p2.name, o1.name, o2.name);
      
      const key1 = [...team1].sort().join("-"); const key2 = [...team2].sort().join("-");
      setHistoryPairs(prev => ({ ...prev, [key1]: (prev[key1] || 0) + 1, [key2]: (prev[key2] || 0) + 1 }));
    }

    const assignedMatches = rawMatches.map((m, idx) => ({ ...m, court: courts[idx % courts.length] }));
    const nextWaitingQueue = activeNames.filter(name => !playedThisRound.includes(name));
    
    setMatches(assignedMatches); setSittingOut(nextWaitingQueue); setWaitingQueue(nextWaitingQueue);
    localStorage.setItem("savedCurrentMatches", JSON.stringify(assignedMatches));
  };

  const sendToScoreboard = (team1: string[], team2: string[]) => {
    const t1 = encodeURIComponent(team1.join(" & ")); const t2 = encodeURIComponent(team2.join(" & "));
    window.location.href = `/?t1=${t1}&t2=${t2}`;
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  // Lọc tìm Top 1 Elo (Nhà Vua)
  const sortedPlayers = [...players].sort((a,b) => b.elo - a.elo);
  const top1PlayerName = sortedPlayers.length > 0 ? sortedPlayers[0].name : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans uppercase pb-20">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 border-b border-[#b537f2] pb-4">
        <h1 className="text-xl font-black text-[#b537f2] tracking-widest drop-shadow-[0_0_8px_rgba(181,55,242,0.5)]">HỆ THỐNG GHÉP KÈO</h1>
        <a href="/" className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</a>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* KHU VỰC ĐIỂM DANH */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#39ff14] rounded-full animate-pulse"></span> CẤU HÌNH RẢI KÈO
          </h2>
          <div className="mb-6 p-4 border border-[#39ff14]/20 rounded bg-black">
            <label className="block text-gray-400 text-xs font-bold mb-2 tracking-widest">QUẢN LÝ DANH SÁCH SÂN</label>
            <div className="flex gap-2 mb-3">
              <input value={newCourt} onChange={(e) => setNewCourt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCourt()} placeholder="VD: SÂN 3..." className="flex-1 bg-black border border-gray-700 text-white px-3 py-2 rounded focus:border-[#39ff14] focus:outline-none" />
              <button onClick={handleAddCourt} className="bg-[#39ff14] text-black px-4 py-2 rounded font-bold active:opacity-50 touch-manipulation">THÊM SÂN</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {courts.map(c => (
                <div key={c} className="flex items-center gap-2 bg-[#111] border border-[#39ff14]/50 px-3 py-1 rounded text-[#39ff14] text-sm">
                  {c} <button onClick={() => handleRemoveCourt(c)} className="text-[#ff003c] font-black ml-1 active:scale-125 touch-manipulation p-1">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
             <div className="flex gap-2 mb-4">
              <input value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()} placeholder="NHẬP TÊN TAY VỢT MỚI..." className="flex-1 bg-black border border-gray-700 text-[#00f3ff] font-bold px-4 py-3 rounded focus:border-[#00f3ff] focus:outline-none" />
              <button onClick={handleAddPlayer} className="bg-[#00f3ff] text-black px-6 py-3 rounded font-black active:opacity-50 touch-manipulation">ADD</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map(p => {
                const isPresent = presentPlayers.includes(p.name);
                const isTop1 = p.name === top1PlayerName;
                const onFire = (p.winstreak || 0) >= 3;
                
                return (
                  <button key={p.name} onClick={() => toggleAttendance(p.name)}
                    className={`px-4 py-2 rounded font-bold tracking-widest text-sm border transition-colors touch-manipulation relative ${isPresent ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-black border-gray-800 text-gray-500'}`}
                  >
                    {isTop1 && <span className="absolute -top-3 -left-2 text-lg">👑</span>}
                    {p.name} {isPresent ? '✔' : ''}
                    {onFire && <span className="absolute -top-3 -right-2 text-lg animate-bounce">🔥</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={generateFairMatches} className="w-full bg-[#b537f2] text-white active:opacity-50 font-black py-4 rounded text-lg tracking-widest transition-opacity touch-manipulation shadow-[0_0_15px_rgba(181,55,242,0.4)]">🚀 RẢI KÈO VÀO SÂN</button>
        </div>

        {/* DANH SÁCH TRẬN */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#ff003c]/30 shadow-[0_0_15px_rgba(255,0,60,0.1)]">
          <h2 className="text-[#ff003c] font-black tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-[#ff003c] rounded-full animate-pulse"></span> MATCHES READY</h2>
          {matches.length === 0 ? (
            <div className="text-center text-gray-600 py-6 tracking-widest font-bold">AWAITING EXECUTION...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match, idx) => (
                <div key={idx} className="bg-black p-4 rounded border border-gray-800 relative">
                  <div className="absolute top-0 right-0 bg-[#ff003c] text-black text-xs font-black px-3 py-1 rounded-bl">📍 {match.court}</div>
                  <h3 className="text-[#fcee0a] text-sm font-black mb-4">TRẬN {idx + 1}</h3>
                  <div className="flex justify-between items-center mb-5 font-black text-sm">
                    <div className="flex-1 text-[#ff003c] text-right">{match.team1.join(' & ')}</div>
                    <div className="px-3 text-gray-600">VS</div>
                    <div className="flex-1 text-[#00f3ff] text-left">{match.team2.join(' & ')}</div>
                  </div>
                  <button onClick={() => sendToScoreboard(match.team1, match.team2)} className="w-full bg-[#fcee0a] text-black active:opacity-50 py-2 rounded font-black tracking-widest text-xs touch-manipulation">⚡ LÊN BẢNG ĐIỂM</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BẢNG XẾP HẠNG GAMIFICATION */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
          <h2 className="text-[#00f3ff] font-black tracking-widest mb-4 border-b border-[#00f3ff]/20 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse"></span> GLOBAL LEADERBOARD
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedPlayers.map(p => {
              const total = p.wins + p.losses;
              const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
              const isTop1 = p.name === top1PlayerName;
              const onFire = (p.winstreak || 0) >= 3;

              return (
                <div key={p.name} className={`flex justify-between items-center bg-black p-3 rounded border transition-colors touch-manipulation ${isTop1 ? 'border-[#fcee0a] shadow-[0_0_10px_rgba(252,238,10,0.2)]' : (onFire ? 'border-[#ff003c] shadow-[0_0_10px_rgba(255,0,60,0.2)]' : 'border-gray-800')}`}>
                  <div className="flex items-center gap-2">
                    {/* Hiển thị Vương Miện và Lửa */}
                    {isTop1 && <span className="text-xl" title="Top 1 Câu Lạc Bộ">👑</span>}
                    {onFire && <span className="text-xl animate-pulse" title={`Chuỗi thắng ${p.winstreak} trận`}>🔥</span>}
                    
                    <div onClick={() => renamePlayer(p.name)} className={`font-black tracking-wider text-sm cursor-pointer py-1 ${isTop1 ? 'text-[#fcee0a]' : (onFire ? 'text-[#ff003c]' : 'text-gray-200')}`}>
                      {p.name} ✏️
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs tracking-widest hidden sm:block">
                      <span className="text-[#39ff14] font-black">{p.wins}W</span>
                      <span className="text-gray-600 mx-1">-</span>
                      <span className="text-[#ff003c] font-black">{p.losses}L</span> 
                    </div>
                    <span className="bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] px-2 py-1 rounded text-xs font-black tracking-widest shadow-[0_0_5px_rgba(181,55,242,0.3)]">
                      {p.elo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}