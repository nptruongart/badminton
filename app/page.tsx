"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [team1Name, setTeam1Name] = useState("ĐỘI 1");
  const [team2Name, setTeam2Name] = useState("ĐỘI 2");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t1 = params.get("t1");
    const t2 = params.get("t2");
    if (t1) setTeam1Name(decodeURIComponent(t1));
    if (t2) setTeam2Name(decodeURIComponent(t2));
  }, []);

  const resetScores = () => {
    if (confirm("Xóa trắng dữ liệu hệ thống?")) {
      setScore1(0);
      setScore2(0);
    }
  };

  const saveMatch = async () => {
    if (score1 === 0 && score2 === 0) {
      alert("WARNING: Trận đấu chưa có dữ liệu điểm!");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Name, team2Name, score1, score2 }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`✅ DATA SAVED!\n\n${team1Name} (${score1}) - ${team2Name} (${score2})`);
        setScore1(0);
        setScore2(0);
      } else {
        alert("SYSTEM ERROR: " + data.error);
      }
    } catch (error) {
      alert("OFFLINE: Mất kết nối đến máy chủ!");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] flex flex-col items-center justify-center p-2 md:p-4 select-none font-sans uppercase overflow-hidden">
      
      {/* Tiêu đề Cyberpunk (Tự thu nhỏ margin khi xoay ngang) */}
      <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c] tracking-[0.2em] mb-6 landscape:mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] text-center">
        CYBER BADMINTON
      </h1>

      {/* WRAPPER CHÍNH: Dọc thì xếp chồng, Ngang (landscape) thì chia 2 cột */}
      <div className="flex flex-col landscape:flex-row w-full max-w-md landscape:max-w-5xl items-center justify-center gap-4 landscape:gap-8">

        {/* CỘT TRÁI: BẢNG ĐIỂM */}
        <div className="flex flex-row w-full flex-1 gap-3">
          
          {/* ĐỘI 1 */}
          <div className="flex-1 flex flex-col items-center bg-[#0d0d0d] border border-[#ff003c] rounded-xl p-2 sm:p-3 shadow-[0_0_15px_rgba(255,0,60,0.2)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff003c] to-transparent opacity-50"></div>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="w-full bg-transparent text-[#ff003c] text-base sm:text-xl font-black tracking-widest text-center h-10 landscape:h-8 focus:outline-none focus:bg-[#ff003c20] rounded transition-all border-b border-transparent focus:border-[#ff003c] uppercase"
            />
            {/* Điểm số tự động thu nhỏ lại một chút khi xoay ngang để vừa màn hình */}
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[80px] leading-none font-black text-[#ff003c] my-4 landscape:my-1 cursor-pointer active:scale-90 transition-transform drop-shadow-[0_0_20px_rgba(255,0,60,0.8)]"
              onClick={() => setScore1(s => s + 1)}
            >
              {score1}
            </div>
            <button 
              onClick={() => setScore1(s => Math.max(0, s - 1))}
              className="w-full bg-transparent border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-black px-2 py-2 landscape:py-1 rounded font-bold transition-all uppercase tracking-wider text-xs sm:text-sm shadow-[inset_0_0_10px_rgba(255,0,60,0.2)]"
            >
              Trừ 1
            </button>
          </div>

          {/* ĐỘI 2 */}
          <div className="flex-1 flex flex-col items-center bg-[#0d0d0d] border border-[#00f3ff] rounded-xl p-2 sm:p-3 shadow-[0_0_15px_rgba(0,243,255,0.2)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50"></div>
            <input
              type="text"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              className="w-full bg-transparent text-[#00f3ff] text-base sm:text-xl font-black tracking-widest text-center h-10 landscape:h-8 focus:outline-none focus:bg-[#00f3ff20] rounded transition-all border-b border-transparent focus:border-[#00f3ff] uppercase"
            />
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[80px] leading-none font-black text-[#00f3ff] my-4 landscape:my-1 cursor-pointer active:scale-90 transition-transform drop-shadow-[0_0_20px_rgba(0,243,255,0.8)]"
              onClick={() => setScore2(s => s + 1)}
            >
              {score2}
            </div>
            <button 
              onClick={() => setScore2(s => Math.max(0, s - 1))}
              className="w-full bg-transparent border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black px-2 py-2 landscape:py-1 rounded font-bold transition-all uppercase tracking-wider text-xs sm:text-sm shadow-[inset_0_0_10px_rgba(0,243,255,0.2)]"
            >
              Trừ 1
            </button>
          </div>
        </div>

        {/* DECOR VS - Chỉ hiện khi cầm dọc (landscape:hidden) để đỡ chiếm chỗ khi xoay ngang */}
        <div className="w-full max-w-md flex flex-col items-center justify-center my-2 opacity-80 landscape:hidden">
          <div className="flex items-center w-full gap-3 px-6">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#ff003c]"></div>
            <div className="text-white font-black tracking-[0.3em] text-lg animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">VS</div>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#00f3ff]"></div>
          </div>
          <div className="text-gray-500 font-mono text-[10px] tracking-[0.2em] mt-2 text-center">
            /// SYSTEM.MATCH_ACTIVE // SECURE_CONNECTION ///
          </div>
        </div>

        {/* CỘT PHẢI: MENU CHỨC NĂNG (Gom gọn lại khi xoay ngang) */}
        <div className="flex flex-col gap-3 landscape:gap-2 w-full max-w-md landscape:w-[320px]">
          
          <Link href="/matchmaking" className="relative group w-full bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] hover:bg-[#b537f2] hover:text-white font-black py-4 landscape:py-3 rounded flex justify-center items-center gap-2 text-lg landscape:text-base transition-all shadow-[0_0_15px_rgba(181,55,242,0.3)] active:scale-95 tracking-widest">
            <span className="absolute left-0 top-0 w-2 h-full bg-[#b537f2]"></span>
            ⚡ RẢI KÈO
          </Link>

          <button onClick={saveMatch} disabled={isSaving} className={`relative group w-full bg-[#0d0d0d] border ${isSaving ? 'border-gray-500 text-gray-500' : 'border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black'} font-black py-4 landscape:py-3 rounded flex justify-center items-center gap-2 text-lg landscape:text-base transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] active:scale-95 tracking-widest`}>
            <span className={`absolute left-0 top-0 w-2 h-full ${isSaving ? 'bg-gray-500' : 'bg-[#39ff14]'}`}></span>
            {isSaving ? 'SYSTEM SAVING...' : '💾 LƯU TRẬN'}
          </button>

          <div className="grid grid-cols-2 gap-3 landscape:gap-2">
            <button onClick={resetScores} className="relative group w-full bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-white font-black py-3 landscape:py-2 rounded flex justify-center items-center text-sm transition-all shadow-[0_0_10px_rgba(255,0,60,0.3)] active:scale-95 tracking-widest">
              <span className="absolute left-0 top-0 w-1.5 h-full bg-[#ff003c]"></span>
              🔄 RESET
            </button>
            <Link href="/history" className="relative group w-full bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black font-black py-3 landscape:py-2 rounded flex justify-center items-center text-sm transition-all shadow-[0_0_10px_rgba(0,243,255,0.3)] active:scale-95 tracking-widest">
              <span className="absolute right-0 top-0 w-1.5 h-full bg-[#00f3ff]"></span>
              LỊCH SỬ 📊
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 landscape:gap-2">
            <Link href="/finance" className="relative group w-full bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] hover:bg-[#fcee0a] hover:text-black font-black py-3 landscape:py-2 rounded flex justify-center items-center text-sm transition-all shadow-[0_0_10px_rgba(252,238,10,0.3)] active:scale-95 tracking-widest">
              <span className="absolute left-0 top-0 w-1.5 h-full bg-[#fcee0a]"></span>
              💰 TÀI CHÍNH
            </Link>
            <Link href="/settings" className="relative group w-full bg-[#0d0d0d] border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black font-black py-3 landscape:py-2 rounded flex justify-center items-center text-sm transition-all shadow-[0_0_10px_rgba(156,163,175,0.3)] active:scale-95 tracking-widest">
              <span className="absolute right-0 top-0 w-1.5 h-full bg-gray-400"></span>
              SYSTEM ⚙️
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}