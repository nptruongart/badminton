"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [players, setPlayers] = useState<{ id: number; name: string }[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [maxScore, setMaxScore] = useState(21);
  const [shuttlePrice, setShuttlePrice] = useState(15000);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thành viên:", error);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name: newPlayerName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPlayerName("");
        fetchPlayers();
      }
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
    }
  };

  const deletePlayer = async (id: number) => {
    if (!confirm("⚠️ WARNING: Xóa tay vợt này khỏi Database?")) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPlayers();
      }
    } catch (error) {
      console.error("Lỗi xoá thành viên:", error);
    }
  };

  const deleteAllPlayers = async () => {
    if (!confirm("🔥 DANGER: CẢNH BÁO ĐỎ! Bạn có chắc chắn muốn XOÁ TOÀN BỘ DATA thành viên không? Hành động này không thể hoàn tác!")) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAll" }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayers([]); 
      }
    } catch (error) {
      console.error("Lỗi khi xoá toàn bộ:", error);
    }
  };

  const saveConfig = () => {
    alert("✅ SYSTEM: ĐÃ LƯU CẤU HÌNH HỆ THỐNG!");
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] text-white p-4 font-sans uppercase pb-20">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 mt-4 border-b border-gray-600 pb-4 shadow-[0_4px_15px_-5px_rgba(255,255,255,0.1)] gap-4">
        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          SYSTEM CONFIG ⚙️
        </h1>
        <div className="flex gap-2">
          <Link href="/finance" className="bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] hover:bg-[#fcee0a] hover:text-black px-4 py-2 rounded font-black transition-all shadow-[0_0_10px_rgba(252,238,10,0.2)] tracking-widest text-xs sm:text-sm">
            💰 TÀI CHÍNH
          </Link>
          <Link href="/" className="relative group bg-[#0d0d0d] border border-gray-500 hover:border-white text-gray-400 hover:text-white px-4 py-2 rounded font-black transition-all shadow-none hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] tracking-widest text-xs sm:text-sm">
            <span className="absolute left-0 top-0 w-1 h-full bg-gray-500 group-hover:bg-white transition-all"></span>
            HOME
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* BOX QUẢN LÝ THÀNH VIÊN - NEON CYAN */}
        <div className="bg-[#0d0d0d] p-5 md:p-6 rounded border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#00f3ff]/10 to-transparent"></div>
          
          <h2 className="text-[#00f3ff] font-black tracking-widest mb-6 border-b border-[#00f3ff]/20 pb-2 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
            <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse"></span>
            DATABASE THÀNH VIÊN
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="NHẬP TÊN TAY VỢT MỚI..."
              className="flex-1 bg-black text-[#00f3ff] border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all font-black tracking-wider placeholder-gray-700"
            />
            <div className="flex gap-2">
              <button
                onClick={addPlayer}
                className="bg-[#0d0d0d] border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black font-black px-6 py-3 rounded transition-all shadow-[0_0_10px_rgba(57,255,20,0.2)] tracking-widest"
              >
                + ADD
              </button>
              <button
                onClick={deleteAllPlayers}
                className="bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-black font-black px-4 py-3 rounded transition-all shadow-[0_0_10px_rgba(255,0,60,0.2)] tracking-widest whitespace-nowrap"
              >
                🔥 PURGE ALL
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 relative z-10">
            {players.map((player) => (
              <div key={player.id} className="bg-black border border-[#00f3ff]/40 hover:border-[#00f3ff] rounded px-3 py-1.5 flex items-center gap-2 transition-all shadow-[inset_0_0_5px_rgba(0,243,255,0.1)] group">
                <span className="font-bold text-gray-300 tracking-wider text-sm">{player.name}</span>
                <button 
                  onClick={() => deletePlayer(player.id)}
                  className="text-gray-600 group-hover:text-[#ff003c] font-black ml-1 text-lg leading-none transition-colors drop-shadow-[0_0_5px_rgba(255,0,60,0)] group-hover:drop-shadow-[0_0_5px_rgba(255,0,60,0.8)]"
                  title="Xoá tay vợt này"
                >
                  ×
                </button>
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-gray-600 font-bold tracking-widest text-sm w-full text-center py-4">SYSTEM EMPTY. NO PLAYERS DETECTED.</p>
            )}
          </div>
        </div>

        {/* BOX CẤU HÌNH - NEON YELLOW */}
        <div className="bg-[#0d0d0d] p-5 md:p-6 rounded border border-[#fcee0a]/30 shadow-[0_0_15px_rgba(252,238,10,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#fcee0a]/10 to-transparent"></div>

          <h2 className="text-[#fcee0a] font-black tracking-widest mb-6 border-b border-[#fcee0a]/20 pb-2 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(252,238,10,0.5)]">
            <span className="w-2 h-2 bg-[#fcee0a] rounded-full animate-pulse"></span>
            THÔNG SỐ MẶC ĐỊNH
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
            <div>
              <label className="block text-gray-400 text-xs font-black tracking-widest mb-2">🏁 ĐIỂM SỐ TỐI ĐA TRẬN ĐẤU</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full bg-black text-[#fcee0a] border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-[#fcee0a] focus:shadow-[0_0_10px_rgba(252,238,10,0.2)] transition-all font-black tracking-wider text-xl"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-black tracking-widest mb-2">🏸 GIÁ TIỀN 1 QUẢ CẦU (VNĐ)</label>
              <input
                type="number"
                value={shuttlePrice}
                onChange={(e) => setShuttlePrice(Number(e.target.value))}
                className="w-full bg-black text-[#39ff14] border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-[#39ff14] focus:shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all font-black tracking-wider text-xl"
              />
            </div>
          </div>

          <button 
            onClick={saveConfig}
            className="relative group w-full bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] hover:bg-[#fcee0a] hover:text-black font-black py-4 rounded flex justify-center items-center gap-2 text-lg transition-all shadow-[0_0_15px_rgba(252,238,10,0.3)] active:scale-95 tracking-widest z-10"
          >
            <span className="absolute left-0 top-0 w-2 h-full bg-[#fcee0a]"></span>
            💾 LƯU CẤU HÌNH HỆ THỐNG
          </button>
        </div>
        
      </div>
    </div>
  );
}