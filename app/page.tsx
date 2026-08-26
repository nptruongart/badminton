"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // Dùng lại Link gốc của Next.js cho cực chuẩn

export default function Home() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [team1Name, setTeam1Name] = useState("ĐỘI 1");
  const [team2Name, setTeam2Name] = useState("ĐỘI 2");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cyber_match_state");
    const params = new URLSearchParams(window.location.search);
    const t1 = params.get("t1");
    const t2 = params.get("t2");

    if (t1 || t2) {
      setTeam1Name(t1 ? decodeURIComponent(t1) : "ĐỘI 1");
      setTeam2Name(t2 ? decodeURIComponent(t2) : "ĐỘI 2");
      setScore1(0);
      setScore2(0);
      window.history.replaceState(null, '', '/'); 
    } else if (saved) {
      const data = JSON.parse(saved);
      setScore1(data.score1 || 0);
      setScore2(data.score2 || 0);
      setTeam1Name(data.team1Name || "ĐỘI 1");
      setTeam2Name(data.team2Name || "ĐỘI 2");
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cyber_match_state", JSON.stringify({ team1Name, team2Name, score1, score2 }));
    }
  }, [score1, score2, team1Name, team2Name, isLoaded]);

  const resetScores = () => {
    if (confirm("Reset trận đấu này?")) {
      setScore1(0);
      setScore2(0);
    }
  };

  const saveMatch = () => {
    if (score1 === 0 && score2 === 0) return alert("WARNING: Trận chưa có điểm!");
    
    const history = JSON.parse(localStorage.getItem("cyber_match_history") || "[]");
    history.unshift({
      id: Date.now(),
      team1: team1Name,
      team2: team2Name,
      score1,
      score2,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("cyber_match_history", JSON.stringify(history));

    let players = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    const isT1Win = score1 > score2;
    const isT2Win = score2 > score1;
    const isDraw = score1 === score2;

    const t1Names = team1Name.split(" & ").map(n => n.trim());
    const t2Names = team2Name.split(" & ").map(n => n.trim());

    players = players.map((p: any) => {
      if (t1Names.includes(p.name)) {
        let eloChange = isDraw ? 0 : (isT1Win ? 10 : -5);
        return { ...p, 
          wins: isT1Win ? p.wins + 1 : p.wins, 
          losses: (!isT1Win && !isDraw) ? p.losses + 1 : p.losses, 
          elo: (p.elo || 1000) + eloChange 
        };
      }
      if (t2Names.includes(p.name)) {
        let eloChange = isDraw ? 0 : (isT2Win ? 10 : -5);
        return { ...p, 
          wins: isT2Win ? p.wins + 1 : p.wins, 
          losses: (!isT2Win && !isDraw) ? p.losses + 1 : p.losses, 
          elo: (p.elo || 1000) + eloChange 
        };
      }
      return p;
    });
    localStorage.setItem("cyber_players", JSON.stringify(players));
    
    alert(`✅ LƯU THÀNH CÔNG VÀ ĐÃ CẬP NHẬT ELO!\n\n${team1Name} (${score1}) - ${team2Name} (${score2})`);
    setScore1(0);
    setScore2(0);
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] flex flex-col items-center justify-center p-2 md:p-4 select-none font-sans uppercase overflow-hidden">
      
      <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c] tracking-[0.2em] mb-4 landscape:mb-2 text-center">
        CYBER BADMINTON
      </h1>

      <div className="flex flex-col items-center justify-center w-full max-w-md landscape:max-w-4xl gap-4 landscape:gap-3">
        <div className="flex flex-row w-full gap-3 landscape:gap-6">
          
          <div className="flex-1 flex flex-col items-center bg-[#0d0d0d] border border-[#ff003c] rounded-xl p-2 sm:p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff003c] to-transparent opacity-50"></div>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="w-full bg-transparent text-[#ff003c] text-base sm:text-xl landscape:text-2xl font-black tracking-widest text-center h-10 focus:outline-none focus:bg-[#ff003c20] rounded transition-all border-b border-transparent focus:border-[#ff003c]"
            />
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[100px] leading-none font-black text-[#ff003c] my-4 landscape:my-1 cursor-pointer active:scale-[0.85] transition-transform duration-75 touch-manipulation"
              onClick={() => setScore1(s => s + 1)}
            >
              {score1}
            </div>
            <button 
              onClick={() => setScore1(s => Math.max(0, s - 1))}
              className="w-full bg-[#1a0006] active:bg-[#ff003c] active:text-black border border-[#ff003c] text-[#ff003c] px-2 py-2 rounded font-bold transition-colors tracking-wider text-xs sm:text-sm touch-manipulation flex items-center justify-center"
            >
              Trừ 1
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center bg-[#0d0d0d] border border-[#00f3ff] rounded-xl p-2 sm:p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50"></div>
            <input
              type="text"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              className="w-full bg-transparent text-[#00f3ff] text-base sm:text-xl landscape:text-2xl font-black tracking-widest text-center h-10 focus:outline-none focus:bg-[#00f3ff20] rounded transition-all border-b border-transparent focus:border-[#00f3ff]"
            />
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[100px] leading-none font-black text-[#00f3ff] my-4 landscape:my-1 cursor-pointer active:scale-[0.85] transition-transform duration-75 touch-manipulation"
              onClick={() => setScore2(s => s + 1)}
            >
              {score2}
            </div>
            <button 
              onClick={() => setScore2(s => Math.max(0, s - 1))}
              className="w-full bg-[#001a1a] active:bg-[#00f3ff] active:text-black border border-[#00f3ff] text-[#00f3ff] px-2 py-2 rounded font-bold transition-colors tracking-wider text-xs sm:text-sm touch-manipulation flex items-center justify-center"
            >
              Trừ 1
            </button>
          </div>
        </div>

        {/* CÁC NÚT ĐÃ ĐƯỢC ĐỔI LẠI SANG THẺ <Link> CHUẨN */}
        <div className="flex flex-col w-full gap-3 landscape:gap-3">
          <div className="flex flex-col landscape:flex-row gap-3">
            <Link href="/matchmaking" className="flex-1 bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] active:bg-[#b537f2] active:text-white font-black py-4 landscape:py-3 rounded flex justify-center items-center text-lg landscape:text-sm transition-colors tracking-widest touch-manipulation">
              ⚡ RẢI KÈO
            </Link>
            <button onClick={saveMatch} className="flex-1 bg-[#0d0d0d] border border-[#39ff14] text-[#39ff14] active:bg-[#39ff14] active:text-black font-black py-4 landscape:py-3 rounded flex justify-center items-center text-lg landscape:text-sm transition-colors tracking-widest touch-manipulation">
              💾 LƯU TRẬN
            </button>
          </div>

          <div className="flex flex-col landscape:flex-row gap-3">
            <div className="flex flex-row flex-1 gap-3">
              <button onClick={resetScores} className="flex-1 bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] active:bg-[#ff003c] active:text-white font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs transition-colors tracking-widest touch-manipulation">
                🔄 RESET
              </button>
              <Link href="/history" className="flex-1 bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] active:bg-[#00f3ff] active:text-black font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs transition-colors tracking-widest touch-manipulation">
                LỊCH SỬ 📊
              </Link>
            </div>
            
            <div className="flex flex-row flex-1 gap-3">
              <Link href="/finance" className="flex-1 bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] active:bg-[#fcee0a] active:text-black font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs transition-colors tracking-widest touch-manipulation">
                💰 TÀI CHÍNH
              </Link>
              <Link href="/settings" className="flex-1 bg-[#0d0d0d] border border-gray-400 text-gray-400 active:bg-gray-400 active:text-black font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs transition-colors tracking-widest touch-manipulation">
                SYSTEM ⚙️
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}