"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MatchRecord {
  id: number;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.matches);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải lịch sử:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const clearHistory = async () => {
    if (!confirm("⚠️ WARNING: Xóa sạch dữ liệu hệ thống? Hành động này không thể hoàn tác!")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/matches', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMatches([]);
        alert("SYSTEM: Đã dọn dẹp bộ nhớ!");
      } else {
        alert("ERROR: Lỗi hệ thống!");
      }
    } catch (error) {
      alert("OFFLINE: Mất kết nối đến máy chủ!");
    }
    setIsDeleting(false);
  };

  const filteredMatches = matches.filter(match => 
    match.team1.toLowerCase().includes(filterText.toLowerCase()) || 
    match.team2.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] text-white p-4 font-sans uppercase pb-20">
      
      {/* Header */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6 mt-4 border-b border-[#00f3ff] pb-4 shadow-[0_4px_15px_-5px_rgba(0,243,255,0.3)]">
        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#0088ff] tracking-widest drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
          DATABASE LỊCH SỬ
        </h1>
        <Link href="/" className="relative group bg-[#0d0d0d] border border-gray-500 hover:border-[#00f3ff] text-gray-400 hover:text-[#00f3ff] px-4 py-2 rounded font-bold transition-all shadow-[0_0_10px_rgba(0,243,255,0)] hover:shadow-[0_0_10px_rgba(0,243,255,0.4)] tracking-widest text-sm">
          <span className="absolute left-0 top-0 w-1 h-full bg-gray-500 group-hover:bg-[#00f3ff] transition-all"></span>
          QUAY LẠI
        </Link>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* BỘ LỌC & NÚT XÓA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f3ff]">⚡</span>
            <input
              type="text"
              placeholder="QUÉT TÊN TAY VỢT..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#00f3ff]/30 text-[#00f3ff] pl-10 pr-4 py-3 rounded focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all font-bold tracking-wider"
            />
          </div>
          
          <button 
            onClick={clearHistory}
            disabled={isDeleting || matches.length === 0}
            className={`relative px-6 py-3 font-black rounded transition-all tracking-widest whitespace-nowrap overflow-hidden ${
              matches.length === 0 
                ? 'bg-[#0d0d0d] border border-gray-700 text-gray-700 cursor-not-allowed' 
                : 'bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-black shadow-[0_0_15px_rgba(255,0,60,0.3)]'
            }`}
          >
            {isDeleting ? "PROCESSING..." : "PURGE DATA"}
          </button>
        </div>

        {/* DANH SÁCH TRẬN ĐẤU */}
        {loading ? (
          <div className="text-center text-[#00f3ff] py-10 animate-pulse tracking-widest font-bold drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
            LOADING DATABASE...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center bg-[#0d0d0d] p-10 rounded border border-[#00f3ff]/20 text-[#00f3ff]/50 font-bold tracking-widest">
            {matches.length === 0 
              ? "SYSTEM EMPTY. NO RECORDS FOUND." 
              : "MATCH NOT FOUND IN DATABASE."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match.id} className="group bg-[#0d0d0d] p-4 rounded border border-gray-800 hover:border-[#00f3ff] flex flex-col md:flex-row justify-between items-center gap-4 transition-all shadow-none hover:shadow-[0_0_15px_rgba(0,243,255,0.15)] relative overflow-hidden">
                
                {/* Góc chéo trang trí */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#00f3ff]/20 to-transparent"></div>

                {/* Cột thời gian */}
                <div className="text-gray-500 text-xs md:w-1/4 text-center md:text-left tracking-widest font-mono">
                  {new Date(match.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </div>

                {/* Cột Tỷ số */}
                <div className="flex items-center justify-center gap-3 flex-1 w-full">
                  <div className="flex-1 text-right">
                    <div className={`font-black tracking-wider text-sm sm:text-base ${match.score1 > match.score2 ? 'text-[#ff003c] drop-shadow-[0_0_5px_rgba(255,0,60,0.8)]' : 'text-gray-400'}`}>
                      {match.team1}
                    </div>
                  </div>

                  {/* Bảng điểm LED mini */}
                  <div className="bg-black px-4 py-2 rounded font-black text-xl tracking-widest min-w-[90px] text-center border border-gray-700 shadow-[inset_0_0_10px_rgba(0,0,0,1)]">
                    <span className={match.score1 > match.score2 ? 'text-[#ff003c]' : 'text-gray-500'}>{match.score1}</span>
                    <span className="text-gray-700 mx-2">:</span>
                    <span className={match.score2 > match.score1 ? 'text-[#00f3ff]' : 'text-gray-500'}>{match.score2}</span>
                  </div>

                  <div className="flex-1 text-left">
                    <div className={`font-black tracking-wider text-sm sm:text-base ${match.score2 > match.score1 ? 'text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' : 'text-gray-400'}`}>
                      {match.team2}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}