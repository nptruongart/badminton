"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Player { name: string; elo: number; wins: number; losses: number; }

export default function MatchmakingPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [presentPlayers, setPresentPlayers] = useState<string[]>([]);
  
  const [matches, setMatches] = useState<{ team1: string[], team2: string[], court: string }[]>([]);
  const [sittingOut, setSittingOut] = useState<string[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<string[]>([]);
  const [historyPairs, setHistoryPairs] = useState<Record<string, number>>({});
  
  // UX mới cho Danh sách sân
  const [courts, setCourts] = useState<string[]>(["Sân 1", "Sân 2"]);
  const [newCourt, setNewCourt] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Lấy data TỨC THÌ từ LocalStorage không cần chờ API
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    setPlayers(savedPlayers);
    setPresentPlayers(savedPlayers.map((p: Player) => p.name));

    const savedCourts = JSON.parse(localStorage.getItem("cyber_courts") || '["Sân 1", "Sân 2"]');
    setCourts(savedCourts);

    const savedMatches = localStorage.getItem("savedCurrentMatches");
    if (savedMatches) setMatches(JSON.parse(savedMatches));
  }, []);

  const handleAddCourt = () => {
    if (!newCourt.trim() || courts.includes(newCourt.trim())) return;
    const updatedCourts = [...courts, newCourt.trim()];
    setCourts(updatedCourts);
    localStorage.setItem("cyber_courts", JSON.stringify(updatedCourts));
    setNewCourt("");
  };

  const handleRemoveCourt = (c: string) => {
    const updated = courts.filter(court => court !== c);
    setCourts(updated);
    localStorage.setItem("cyber_courts", JSON.stringify(updated));
  };

  const handleAddPlayer = () => {
    if (!newPlayer.trim()) return;
    const name = newPlayer.trim();
    if (players.some(p => p.name === name)) return alert("TÊN ĐÃ TỒN TẠI!");

    const newP = { name, elo: 1000, wins: 0, losses: 0 };
    const updated = [...players, newP];
    setPlayers(updated);
    setPresentPlayers([...presentPlayers, name]);
    localStorage.setItem("cyber_players", JSON.stringify(updated));
    setNewPlayer("");
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
      const indexA = waitingQueue.indexOf(a);
      const indexB = waitingQueue.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    const playerObjects = sortedNames.map(name => {
      const p = players.find(x => x.name === name)!;
      const total = p.wins + p.losses;
      const winRate = total > 0 ? p.wins / total : 0.5;
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
      const team1 = [p1.name, p2.name];
      const team1Power = p1.powerScore + p2.powerScore;

      let bestIndices = [0, 1]; let minDiff = Infinity;
      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          const diff = Math.abs(team1Power - (pool[i].powerScore + pool[j].powerScore));
          if (diff < minDiff) { minDiff = diff; bestIndices = [i, j]; }
        }
      }
      const o2 = pool.splice(bestIndices[1], 1)[0];
      const o1 = pool.splice(bestIndices[0], 1)[0];
      const team2 = [o1.name, o2.name];

      rawMatches.push({ team1, team2 });
      playedThisRound.push(p1.name, p2.name, o1.name, o2.name);
    }

    const assignedMatches = rawMatches.map((m, idx) => ({
      ...m, court: courts[idx % courts.length]
    }));

    const nextWaitingQueue = activeNames.filter(name => !playedThisRound.includes(name));
    setMatches(assignedMatches);
    setSittingOut(nextWaitingQueue);
    setWaitingQueue(nextWaitingQueue);
    localStorage.setItem("savedCurrentMatches", JSON.stringify(assignedMatches));
  };

  const sendToScoreboard = (team1: string[], team2: string[]) => {
    const t1 = encodeURIComponent(team1.join(" & "));
    const t2 = encodeURIComponent(team2.join(" & "));
    router.push(`/?t1=${t1}&t2=${t2}`);
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans uppercase">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 border-b border-[#b537f2] pb-4">
        <h1 className="text-xl font-black text-[#b537f2] tracking-widest">HỆ THỐNG GHÉP KÈO</h1>
        <Link href="/" className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm">QUAY LẠI</Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ĐIỂM DANH & QUẢN LÝ SÂN */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4">CONFIG HỆ THỐNG</h2>
          
          {/* QUẢN LÝ SÂN UX MỚI */}
          <div className="mb-6 p-4 border border-[#39ff14]/20 rounded">
            <label className="block text-gray-400 text-xs font-bold mb-2">QUẢN LÝ DANH SÁCH SÂN</label>
            <div className="flex gap-2 mb-3">
              <input 
                value={newCourt} onChange={(e) => setNewCourt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCourt()}
                placeholder="VD: Sân 3..." 
                className="flex-1 bg-black border border-gray-700 text-white px-3 py-2 rounded focus:border-[#39ff14] focus:outline-none" 
              />
              <button onClick={handleAddCourt} className="bg-[#39ff14] text-black px-4 py-2 rounded font-bold">THÊM SÂN</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {courts.map(c => (
                <div key={c} className="flex items-center gap-2 bg-[#111] border border-[#39ff14]/50 px-3 py-1 rounded text-[#39ff14] text-sm">
                  {c} <button onClick={() => handleRemoveCourt(c)} className="text-red-500 font-bold ml-1 hover:scale-125">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* QUẢN LÝ PLAYER */}
          <div className="mb-6">
             <div className="flex gap-2 mb-4">
              <input 
                value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="NHẬP TÊN TAY VỢT MỚI..." 
                className="flex-1 bg-black border border-gray-700 text-white px-4 py-3 rounded focus:border-[#00f3ff] focus:outline-none" 
              />
              <button onClick={handleAddPlayer} className="bg-[#00f3ff] text-black px-6 py-3 rounded font-bold">ADD</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map(p => {
                const isPresent = presentPlayers.includes(p.name);
                return (
                  <button key={p.name} onClick={() => toggleAttendance(p.name)}
                    className={`px-4 py-2 rounded font-bold tracking-widest text-sm border ${isPresent ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-black border-gray-800 text-gray-500'}`}
                  >
                    {p.name} {isPresent ? '✔' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={generateFairMatches} className="w-full bg-[#b537f2] text-white active:bg-white active:text-[#b537f2] font-black py-4 rounded text-lg tracking-widest transition-colors touch-manipulation">
            🚀 RẢI KÈO VÀO SÂN
          </button>
        </div>

        {/* DANH SÁCH TRẬN */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#ff003c]/30">
          <h2 className="text-[#ff003c] font-black tracking-widest mb-4">MATCHES READY</h2>
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
                <button onClick={() => sendToScoreboard(match.team1, match.team2)} className="w-full bg-[#fcee0a] text-black active:bg-white py-2 rounded font-black tracking-widest text-xs touch-manipulation">
                  ⚡ LÊN BẢNG ĐIỂM
                </button>
              </div>
            ))}
          </div>
          {sittingOut.length > 0 && (
            <div className="mt-4 p-3 bg-black border border-gray-800 rounded">
              <h3 className="text-gray-500 text-xs font-black mb-1">⏳ DỰ BỊ:</h3>
              <div className="text-white font-bold text-sm">{sittingOut.join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}