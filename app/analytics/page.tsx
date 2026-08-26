"use client";
import { useState, useEffect } from "react";

interface Player {
  name: string;
  elo: number;
  wins: number;
  losses: number;
}

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    const savedMatches = JSON.parse(localStorage.getItem("cyber_match_history") || "[]");
    setPlayers(savedPlayers);
    setMatches(savedMatches);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  const totalMatches = matches.length;
  const sortedByElo = [...players].sort((a, b) => b.elo - a.elo);
  const topPlayer = sortedByElo.length > 0 ? sortedByElo[0] : null;

  // Tính tổng số trận đã đánh của từng người
  const playerStats = players.map(p => {
    const total = p.wins + p.losses;
    const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
    return { ...p, total, winRate };
  }).sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white p-4 font-sans uppercase pb-20 overflow-y-auto">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto flex justify-between items-center mb-6 border-b border-[#00f3ff] pb-4">
        <h1 className="text-xl font-black text-[#00f3ff] tracking-widest drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
          PHÂN TÍCH PHONG ĐỘ 📈
        </h1>
        <a href="/" className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">
          QUAY LẠI
        </a>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* TỔNG QUAN CHỈ SỐ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#b537f2]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1">TỔNG TRẬN ĐẤU</div>
            <div className="text-[#b537f2] text-2xl font-black">{totalMatches}</div>
          </div>
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#39ff14]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1">TOP 1 ELO</div>
            <div className="text-[#39ff14] text-xl font-black truncate w-full">{topPlayer ? `${topPlayer.name} (${topPlayer.elo})` : "CHƯA CÓ"}</div>
          </div>
        </div>

        {/* BIỂU ĐỒ TỈ LỆ THẮNG (WINRATE CHART) */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
          <h2 className="text-[#00f3ff] font-black tracking-widest mb-6 border-b border-[#00f3ff]/20 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse"></span>
            BIỂU ĐỒ TỈ LỆ THẮNG (WINRATE %)
          </h2>

          <div className="space-y-4">
            {playerStats.length === 0 ? (
              <div className="text-center text-gray-600 font-bold py-4">CHƯA CÓ DỮ LIỆU TAY VỢT</div>
            ) : (
              playerStats.map(p => (
                <div key={p.name} className="bg-black p-3 rounded border border-gray-800">
                  <div className="flex justify-between items-center mb-1.5 text-xs font-black">
                    <span className="text-gray-200">{p.name}</span>
                    <span className="text-[#39ff14]">{p.winRate}% THẮNG ({p.wins}W / {p.losses}L)</span>
                  </div>
                  {/* Thanh biểu đồ phần trăm */}
                  <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden p-0.5 border border-gray-800">
                    <div 
                      className="bg-gradient-to-r from-[#00f3ff] to-[#39ff14] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${p.winRate}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BẢNG XẾP HẠNG ELO CHI TIẾT */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#fcee0a]/30 shadow-[0_0_15px_rgba(252,238,10,0.1)]">
          <h2 className="text-[#fcee0a] font-black tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#fcee0a] rounded-full animate-pulse"></span>
            BXH ELO TOÀN CÂU LẠC BỘ
          </h2>
          <div className="space-y-2">
            {sortedByElo.map((p, idx) => (
              <div key={p.name} className="flex justify-between items-center bg-black p-3 rounded border border-gray-800 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono font-bold">#{idx + 1}</span>
                  <span className="font-black text-white">{p.name}</span>
                </div>
                <span className="bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] px-3 py-1 rounded font-black text-xs shadow-[0_0_5px_rgba(252,238,10,0.3)]">
                  {p.elo} ELO
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}