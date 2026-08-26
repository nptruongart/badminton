"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [team1Name, setTeam1Name] = useState("ĐỘI 1");
  const [team2Name, setTeam2Name] = useState("ĐỘI 2");
  const [isLoaded, setIsLoaded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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

  // 🎵 HÀM TẠO ÂM THANH KỸ THUẬT SỐ (SFX)
  const playSfx = (type: 'ting' | 'save' | 'reset') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'ting') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(); osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'save') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'reset') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  const speakScore = (s1: number, s2: number) => {
    if (!voiceEnabled || typeof window === "undefined" || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `${team1Name} ${s1}, ${team2Name} ${s2}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleScore1Change = (newS1: number) => {
    playSfx('ting');
    setScore1(newS1);
    speakScore(newS1, score2);
  };

  const handleScore2Change = (newS2: number) => {
    playSfx('ting');
    setScore2(newS2);
    speakScore(score1, newS2);
  };

  const resetScores = () => {
    if (confirm("Reset trận đấu này?")) {
      playSfx('reset');
      setScore1(0);
      setScore2(0);
    }
  };

  const saveMatch = () => {
    if (score1 === 0 && score2 === 0) return alert("WARNING: Trận chưa có điểm!");
    
    playSfx('save');
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
        return { ...p, wins: isT1Win ? p.wins + 1 : p.wins, losses: (!isT1Win && !isDraw) ? p.losses + 1 : p.losses, elo: (p.elo || 1000) + eloChange };
      }
      if (t2Names.includes(p.name)) {
        let eloChange = isDraw ? 0 : (isT2Win ? 10 : -5);
        return { ...p, wins: isT2Win ? p.wins + 1 : p.wins, losses: (!isT2Win && !isDraw) ? p.losses + 1 : p.losses, elo: (p.elo || 1000) + eloChange };
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
    <div className="min-h-[100dvh] w-full bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] flex flex-col items-center justify-center p-2 md:p-4 pb-12 select-none font-sans uppercase overflow-y-auto">
      <div className="flex flex-col items-center justify-center w-full max-w-md landscape:max-w-4xl gap-4 landscape:gap-3 my-auto pt-6">
        
        <div className="w-full flex justify-between items-center px-2">
          <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c] tracking-[0.2em]">
            CYBER BADMINTON
          </h1>
          <button 
            onClick={() => { playSfx('ting'); setVoiceEnabled(!voiceEnabled); }}
            className={`px-3 py-1 rounded text-xs font-black tracking-widest border transition-all touch-manipulation ${
              voiceEnabled ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.3)]' : 'bg-black border-gray-700 text-gray-500'
            }`}
          >
            {voiceEnabled ? "🔊 AI VOICE: ON" : "🔇 AI VOICE: OFF"}
          </button>
        </div>

        <div className="flex flex-row w-full gap-3 landscape:gap-6 relative z-10">
          <div className="flex-1 flex flex-col items-center bg-[#0d0d0d] border border-[#ff003c] rounded-xl p-2 sm:p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff003c] to-transparent opacity-50"></div>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="w-full bg-transparent text-[#ff003c] text-base sm:text-xl landscape:text-2xl font-black tracking-widest text-center h-10 focus:outline-none focus:bg-[#ff003c20] rounded border-b border-transparent focus:border-[#ff003c]"
            />
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[100px] leading-none font-black text-[#ff003c] my-4 landscape:my-1 cursor-pointer active:scale-[0.85] transition-transform duration-75"
              onClick={() => handleScore1Change(score1 + 1)}
            >
              {score1}
            </div>
            <button 
              onClick={() => handleScore1Change(Math.max(0, score1 - 1))}
              className="w-full bg-[#1a0006] active:opacity-50 border border-[#ff003c] text-[#ff003c] px-2 py-2 rounded font-bold tracking-wider text-xs sm:text-sm flex items-center justify-center touch-manipulation"
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
              className="w-full bg-transparent text-[#00f3ff] text-base sm:text-xl landscape:text-2xl font-black tracking-widest text-center h-10 focus:outline-none focus:bg-[#00f3ff20] rounded border-b border-transparent focus:border-[#00f3ff]"
            />
            <div 
              className="text-[110px] sm:text-[130px] landscape:text-[100px] leading-none font-black text-[#00f3ff] my-4 landscape:my-1 cursor-pointer active:scale-[0.85] transition-transform duration-75"
              onClick={() => handleScore2Change(score2 + 1)}
            >
              {score2}
            </div>
            <button 
              onClick={() => handleScore2Change(Math.max(0, score2 - 1))}
              className="w-full bg-[#001a1a] active:opacity-50 border border-[#00f3ff] text-[#00f3ff] px-2 py-2 rounded font-bold tracking-wider text-xs sm:text-sm flex items-center justify-center touch-manipulation"
            >
              Trừ 1
            </button>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 landscape:gap-3 relative z-50 pb-6 mt-2">
          <div className="flex flex-col landscape:flex-row gap-3">
            <Link href="/matchmaking" onClick={() => playSfx('ting')} className="flex-1 bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] active:opacity-50 font-black py-4 landscape:py-3 rounded flex justify-center items-center text-lg landscape:text-sm tracking-widest touch-manipulation">
              ⚡ RẢI KÈO
            </Link>
            <button onClick={saveMatch} className="flex-1 bg-[#0d0d0d] border border-[#39ff14] text-[#39ff14] active:opacity-50 font-black py-4 landscape:py-3 rounded flex justify-center items-center text-lg landscape:text-sm tracking-widest touch-manipulation">
              💾 LƯU TRẬN
            </button>
          </div>

          <div className="flex flex-col landscape:flex-row gap-3">
            <div className="flex flex-row flex-1 gap-3">
              <button onClick={resetScores} className="flex-1 bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] active:opacity-50 font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs tracking-widest touch-manipulation">
                🔄 RESET
              </button>
              <Link href="/history" onClick={() => playSfx('ting')} className="flex-1 bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] active:opacity-50 font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs tracking-widest touch-manipulation">
                LỊCH SỬ 📊
              </Link>
            </div>
            
            <div className="flex flex-row flex-1 gap-3">
              <Link href="/finance" onClick={() => playSfx('ting')} className="flex-1 bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] active:opacity-50 font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs tracking-widest touch-manipulation">
                💰 TÀI CHÍNH
              </Link>
              <Link href="/settings" onClick={() => playSfx('ting')} className="flex-1 bg-[#0d0d0d] border border-gray-400 text-gray-400 active:opacity-50 font-black py-3 landscape:py-2.5 rounded flex justify-center items-center text-sm landscape:text-xs tracking-widest touch-manipulation">
                SYSTEM ⚙️
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}