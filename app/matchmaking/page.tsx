"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Player {
  name: string;
  elo: number;
  wins: number;
  losses: number;
}

export default function MatchmakingPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [presentPlayers, setPresentPlayers] = useState<string[]>([]);
  
  const [matches, setMatches] = useState<{ team1: string[], team2: string[], court: string }[]>([]);
  const [sittingOut, setSittingOut] = useState<string[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<string[]>([]);
  const [historyPairs, setHistoryPairs] = useState<Record<string, number>>({});
  
  const [courtInput, setCourtInput] = useState<string>("Sân 1, Sân 2");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlayers(data.players);
          setPresentPlayers(data.players.map((p: Player) => p.name));
        }
        setLoading(false);
      })
      .catch(err => console.error("Lỗi:", err));

    const savedMatches = localStorage.getItem("savedCurrentMatches");
    if (savedMatches) {
      try { setMatches(JSON.parse(savedMatches)); } catch (e) { console.error(e); }
    }

    const savedCourts = localStorage.getItem("savedCourtInput");
    if (savedCourts) setCourtInput(savedCourts);
  }, []);

  const handleCourtInputChange = (val: string) => {
    setCourtInput(val);
    localStorage.setItem("savedCourtInput", val);
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.trim()) return;
    const name = newPlayer.trim();
    if (players.some(p => p.name === name)) return alert("TÊN ĐÃ TỒN TẠI TRONG DATABASE!");

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "add", newName: name })
      });
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
        setPresentPlayers([...presentPlayers, name]);
        setNewPlayer("");
      }
    } catch (err) {
      alert("LỖI MẠNG!");
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
    if (presentPlayers.length < 4) {
      alert("WARNING: CẦN ÍT NHẤT 4 TAY VỢT ĐỂ KHỞI ĐỘNG HỆ THỐNG!");
      return;
    }

    const courtsList = courtInput.split(",").map(c => c.trim()).filter(c => c.length > 0);
    const availableCourts = courtsList.length > 0 ? courtsList : ["Sân 1"];
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
      let bestPartnerIdx = 0;
      let minScore = Infinity;

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

      let bestIndices = [0, 1];
      let minDiff = Infinity;

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

      const key1 = [...team1].sort().join("-");
      const key2 = [...team2].sort().join("-");
      setHistoryPairs(prev => ({
        ...prev, [key1]: (prev[key1] || 0) + 1, [key2]: (prev[key2] || 0) + 1
      }));
    }

    const assignedMatches = rawMatches.map((m, idx) => ({
      ...m, court: availableCourts[idx % availableCourts.length]
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

  const copyMatchesToClipboard = () => {
    if (matches.length === 0) return alert("CHƯA CÓ KÈO ĐỂ COPY!");
    let text = "🏸 DANH SÁCH KÈO CẦU LÔNG HÔM NAY:\n";
    matches.forEach((m, idx) => {
      text += `👉 Trận ${idx + 1} (${m.court}): ${m.team1.join(" & ")} vs ${m.team2.join(" & ")}\n`;
    });
    if (sittingOut.length > 0) text += `⏳ Dự bị vòng này: ${sittingOut.join(", ")}`;
    navigator.clipboard.writeText(text);
    alert("✅ ĐÃ COPY DANH SÁCH KÈO!");
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex justify-center items-center text-[#b537f2] font-black tracking-widest animate-pulse">INITIATING SYSTEM...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] text-white p-4 font-sans uppercase">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 mt-4 border-b border-[#b537f2] pb-4 shadow-[0_4px_15px_-5px_rgba(181,55,242,0.3)]">
        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#b537f2] to-[#ff00ff] tracking-widest drop-shadow-[0_0_8px_rgba(181,55,242,0.5)] mb-4 md:mb-0">
          HỆ THỐNG GHÉP KÈO
        </h1>
        <Link href="/" className="relative group bg-[#0d0d0d] border border-gray-500 hover:border-[#b537f2] text-gray-400 hover:text-[#b537f2] px-4 py-2 rounded font-bold transition-all shadow-none hover:shadow-[0_0_10px_rgba(181,55,242,0.4)] tracking-widest text-sm">
          <span className="absolute left-0 top-0 w-1 h-full bg-gray-500 group-hover:bg-[#b537f2] transition-all"></span>
          QUAY LẠI
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ĐIỂM DANH & SÂN BÃI */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4 border-b border-[#39ff14]/20 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#39ff14] rounded-full animate-pulse"></span>
            CONFIG SÂN BÃI & ĐIỂM DANH
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-[#fcee0a] text-xs font-bold tracking-widest mb-2">DANH SÁCH SÂN (CÁCH NHAU BẰNG DẤU PHẨY)</label>
              <input 
                type="text" value={courtInput} onChange={(e) => handleCourtInputChange(e.target.value)}
                className="w-full bg-black border border-gray-700 text-[#fcee0a] px-4 py-3 rounded focus:outline-none focus:border-[#fcee0a] font-black tracking-wider transition-all" 
              />
            </div>
            <div className="flex-1 flex items-end gap-2">
              <input 
                value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} placeholder="NEW PLAYER..." 
                className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-[#00f3ff] font-bold tracking-wider transition-all" 
              />
              <button onClick={handleAddPlayer} className="bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black px-6 py-3 rounded font-black tracking-widest transition-all">
                ADD
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {players.map(p => {
              const isPresent = presentPlayers.includes(p.name);
              return (
                <button 
                  key={p.name} onClick={() => toggleAttendance(p.name)}
                  className={`px-4 py-2 rounded font-black tracking-widest text-sm transition-all border ${
                    isPresent 
                      ? 'bg-[#0d0d0d] border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.3)]' 
                      : 'bg-black border-gray-800 text-gray-600'
                  }`}
                >
                  {p.name} {isPresent ? '✔' : ''}
                </button>
              );
            })}
          </div>

          <button onClick={generateFairMatches} className="relative group w-full bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] hover:bg-[#b537f2] hover:text-white font-black py-4 rounded flex justify-center items-center gap-2 text-lg transition-all shadow-[0_0_15px_rgba(181,55,242,0.3)] active:scale-95 tracking-widest">
            <span className="absolute left-0 top-0 w-2 h-full bg-[#b537f2]"></span>
            🚀 EXECUTE: RẢI KÈO
          </button>
        </div>

        {/* DANH SÁCH TRẬN ĐẤU */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#ff003c]/30 shadow-[0_0_15px_rgba(255,0,60,0.1)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[#ff003c]/20 pb-2 gap-3">
            <h2 className="text-[#ff003c] font-black tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff003c] rounded-full animate-pulse"></span>
              MATCHES READY
            </h2>
            {matches.length > 0 && (
              <button onClick={copyMatchesToClipboard} className="bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black px-4 py-1.5 rounded font-black tracking-widest text-xs transition-all">
                📋 COPY TEXT
              </button>
            )}
          </div>
          
          {matches.length === 0 ? (
            <div className="text-center text-gray-600 py-6 tracking-widest font-bold">AWAITING EXECUTION...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match, idx) => (
                <div key={idx} className="bg-black p-4 rounded border border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ff003c] text-black text-xs font-black px-3 py-1 rounded-bl tracking-widest">
                    📍 {match.court}
                  </div>
                  <h3 className="text-[#fcee0a] text-sm font-black tracking-widest mb-4">TRẬN {idx + 1}</h3>

                  <div className="flex justify-between items-center mb-5 font-black text-sm sm:text-base">
                    <div className="flex-1 text-[#ff003c] text-right drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]">{match.team1.join(' & ')}</div>
                    <div className="px-3 text-gray-600 text-xs">VS</div>
                    <div className="flex-1 text-[#00f3ff] text-left drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{match.team2.join(' & ')}</div>
                  </div>

                  <button 
                    onClick={() => sendToScoreboard(match.team1, match.team2)}
                    className="w-full bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] hover:bg-[#fcee0a] hover:text-black py-2 rounded font-black tracking-widest text-xs transition-all shadow-[inset_0_0_8px_rgba(252,238,10,0.2)]"
                  >
                    ⚡ LÊN BẢNG ĐIỂM
                  </button>
                </div>
              ))}
            </div>
          )}

          {sittingOut.length > 0 && (
            <div className="mt-4 p-3 bg-black border border-gray-800 rounded">
              <h3 className="text-gray-500 text-xs font-black tracking-widest mb-1">⏳ DỰ BỊ / NGHỈ VÒNG NÀY:</h3>
              <div className="text-white font-bold tracking-wider text-sm">{sittingOut.join(', ')}</div>
            </div>
          )}
        </div>

        {/* BẢNG XẾP HẠNG ELO */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
          <h2 className="text-[#00f3ff] font-black tracking-widest mb-4 border-b border-[#00f3ff]/20 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse"></span>
            GLOBAL LEADERBOARD ELO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map(p => {
              const total = p.wins + p.losses;
              const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
              return (
                <div key={p.name} className="flex justify-between items-center bg-black p-3 rounded border border-gray-800">
                  <div className="font-black tracking-wider text-sm">{p.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs tracking-widest">
                      <span className="text-[#39ff14] font-black">{p.wins}W</span>
                      <span className="text-gray-600 mx-1">-</span>
                      <span className="text-[#ff003c] font-black">{p.losses}L</span> 
                      <span className="text-gray-500 ml-1">({winRate}%)</span>
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