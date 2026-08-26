"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [filterText, setFilterText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cyber_match_history") || "[]");
    setMatches(saved);
    setIsLoaded(true);
  }, []);

  const clearHistory = () => {
    if (!confirm("⚠️ WARNING: Xóa sạch dữ liệu trận đấu?")) return;
    localStorage.removeItem("cyber_match_history");
    setMatches([]);
  };

  const filteredMatches = matches.filter(match => 
    match.team1.toLowerCase().includes(filterText.toLowerCase()) || 
    match.team2.toLowerCase().includes(filterText.toLowerCase())
  );

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans uppercase pb-20">
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6 border-b border-[#00f3ff] pb-4">
        <h1 className="text-xl font-black text-[#00f3ff] tracking-widest">LỊCH SỬ</h1>
        <button onClick={() => router.push('/')} className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text" placeholder="QUÉT TÊN TAY VỢT..." value={filterText} onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 bg-[#0d0d0d] border border-[#00f3ff]/30 text-[#00f3ff] px-4 py-3 rounded focus:outline-none font-bold"
          />
          <button 
            onClick={clearHistory} disabled={matches.length === 0}
            className={`px-6 py-3 font-black rounded touch-manipulation ${matches.length === 0 ? 'bg-[#0d0d0d] border border-gray-700 text-gray-700' : 'bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] active:bg-[#ff003c] active:text-black'}`}
          >
            PURGE DATA
          </button>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center bg-[#0d0d0d] p-10 rounded border border-[#00f3ff]/20 text-[#00f3ff]/50 font-bold">SYSTEM EMPTY.</div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match.id} className="bg-[#0d0d0d] p-4 rounded border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-gray-500 text-xs font-mono">{new Date(match.createdAt).toLocaleString('vi-VN')}</div>
                <div className="flex items-center justify-center gap-3 w-full">
                  <div className="flex-1 text-right font-black text-sm sm:text-base text-[#ff003c]">{match.team1}</div>
                  <div className="bg-black px-4 py-2 rounded font-black text-xl border border-gray-700 shrink-0">
                    <span className="text-[#ff003c]">{match.score1}</span><span className="text-gray-700 mx-2">:</span><span className="text-[#00f3ff]">{match.score2}</span>
                  </div>
                  <div className="flex-1 text-left font-black text-sm sm:text-base text-[#00f3ff]">{match.team2}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}