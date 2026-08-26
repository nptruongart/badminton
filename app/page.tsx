"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [team1Name, setTeam1Name] = useState("ĐỘI 1");
  const [team2Name, setTeam2Name] = useState("ĐỘI 2");
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isTvMode, setIsTvMode] = useState(false);
  const [maxScore, setMaxScore] = useState(21);
  const [isListening, setIsListening] = useState(false); 
  const [showPosterBtn, setShowPosterBtn] = useState(false); 

  // Dùng Ref để AI luôn lấy được dữ liệu mới nhất (Điểm và Tên Đội)
  const score1Ref = useRef(0);
  const score2Ref = useRef(0);
  const team1NameRef = useRef("");
  const team2NameRef = useRef("");
  
  useEffect(() => { score1Ref.current = score1; }, [score1]);
  useEffect(() => { score2Ref.current = score2; }, [score2]);
  useEffect(() => { team1NameRef.current = team1Name; }, [team1Name]);
  useEffect(() => { team2NameRef.current = team2Name; }, [team2Name]);

  useEffect(() => {
    const scriptConfetti = document.createElement("script");
    scriptConfetti.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    scriptConfetti.async = true;
    document.body.appendChild(scriptConfetti);

    const scriptCanvas = document.createElement("script");
    scriptCanvas.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    scriptCanvas.async = true;
    document.body.appendChild(scriptCanvas);

    const saved = localStorage.getItem("cyber_match_state");
    const config = JSON.parse(localStorage.getItem("cyber_config") || '{"maxScore": 21}');
    setMaxScore(config.maxScore || 21);

    const params = new URLSearchParams(window.location.search);
    const t1 = params.get("t1");
    const t2 = params.get("t2");

    if (t1 || t2) {
      setTeam1Name(t1 ? decodeURIComponent(t1) : "ĐỘI 1");
      setTeam2Name(t2 ? decodeURIComponent(t2) : "ĐỘI 2");
      setScore1(0); setScore2(0);
      window.history.replaceState(null, '', '/'); 
    } else if (saved) {
      const data = JSON.parse(saved);
      setScore1(data.score1 || 0); setScore2(data.score2 || 0);
      setTeam1Name(data.team1Name || "ĐỘI 1"); setTeam2Name(data.team2Name || "ĐỘI 2");
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cyber_match_state", JSON.stringify({ team1Name, team2Name, score1, score2 }));
      if (score1 >= maxScore || score2 >= maxScore) setShowPosterBtn(true);
      else setShowPosterBtn(false);
    }
  }, [score1, score2, team1Name, team2Name, isLoaded, maxScore]);

  const vibrate = (ms: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  };

  const playSfx = (type: 'ting' | 'save' | 'reset' | 'win' | 'mic') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'ting') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(); osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.start(); osc.stop(ctx.currentTime + 1.5);
      } else if (type === 'mic') {
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {}
  };

  const triggerWin = (winnerTeam: string) => {
    playSfx('win'); vibrate([100, 50, 100, 50, 300]); 
    if ((window as any).confetti) {
      const end = Date.now() + 3000;
      const frame = () => {
        (window as any).confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff003c', '#00f3ff'] });
        (window as any).confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff003c', '#00f3ff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (voiceEnabled && typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Trận đấu kết thúc! Phần thắng thuộc về ${winnerTeam}`);
      utterance.lang = 'vi-VN'; utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakScore = (s1: number, s2: number, scorer: 1 | 2) => {
    if (!voiceEnabled || typeof window === "undefined" || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (s1 >= maxScore || s2 >= maxScore) return;
    const text = scorer === 1 ? `${team1Name} ${s1}, ${team2Name} ${s2}` : `${team2Name} ${s2}, ${team1Name} ${s1}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleScore1Change = (newS1: number) => {
    vibrate(50); playSfx('ting'); setScore1(newS1);
    if (newS1 >= maxScore && score1 < maxScore) triggerWin(team1Name);
    else speakScore(newS1, score2Ref.current, 1);
  };

  const handleScore2Change = (newS2: number) => {
    vibrate(50); playSfx('ting'); setScore2(newS2);
    if (newS2 >= maxScore && score2 < maxScore) triggerWin(team2Name);
    else speakScore(score1Ref.current, newS2, 2);
  };

  // 🔤 THUẬT TOÁN LỘT DẤU TIẾNG VIỆT
  const toNonAccent = (str: string) => {
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu sắc, huyền, hỏi, ngã, nặng
      .replace(/đ/g, "d");             // Đổi đ thành d
  };

  // 🎙️ HÀM AI NGHE LỆNH GIỌNG NÓI (NÂNG CẤP BẮT TÊN CẦU THỦ)
  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ nhận diện giọng nói! (Khuyên dùng Chrome/Safari)");
    
    if (isListening) {
      if ((window as any).recognition) (window as any).recognition.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    
    recognition.onstart = () => { setIsListening(true); playSfx('mic'); vibrate(50); };
    recognition.onresult = (event: any) => {
      const rawTranscript = event.results[event.results.length - 1][0].transcript;
      const transcript = toNonAccent(rawTranscript); // Đưa câu nói về không dấu
      console.log("AI Nghe được (Gốc):", rawTranscript, "-> (Lột dấu):", transcript);
      
      // Bóc tách tên các thành viên của Đội 1 và Đội 2
      // (Ví dụ: "Dean & Liên" -> ["dean", "lien"])
      const t1Players = team1NameRef.current.split('&').map(n => toNonAccent(n.trim())).filter(n => n.length > 0);
      const t2Players = team2NameRef.current.split('&').map(n => toNonAccent(n.trim())).filter(n => n.length > 0);

      // Kiểm tra xem trong câu nói có chứa Tên của người nào không
      const mentionedT1 = t1Players.some(name => transcript.includes(name));
      const mentionedT2 = t2Players.some(name => transcript.includes(name));

      // Kiểm tra cả các từ khóa chung (Bên trái, bên phải...)
      const isTeam1 = mentionedT1 || transcript.includes("doi 1") || transcript.includes("doi mot") || transcript.includes("ben trai") || transcript.includes("doi do");
      const isTeam2 = mentionedT2 || transcript.includes("doi 2") || transcript.includes("doi hai") || transcript.includes("ben phai") || transcript.includes("doi xanh");
      
      if (isTeam1 && !isTeam2) {
        handleScore1Change(score1Ref.current + 1);
      } else if (isTeam2 && !isTeam1) {
        handleScore2Change(score2Ref.current + 1);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
    (window as any).recognition = recognition;
  };

  const capturePoster = () => {
    const el = document.getElementById("scoreboard-zone");
    if (!el || !(window as any).html2canvas) return alert("Lỗi tải thư viện ảnh. Vui lòng tải lại trang!");
    
    playSfx('ting');
    (window as any).html2canvas(el, { backgroundColor: "#050505", scale: 2 }).then((canvas: any) => {
      const link = document.createElement("a");
      link.download = `CyberMatch_${team1Name}_vs_${team2Name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const resetScores = () => { if (confirm("Reset trận đấu này?")) { setScore1(0); setScore2(0); } };

  const saveMatch = () => {
    if (score1 === 0 && score2 === 0) return alert("WARNING: Trận chưa có điểm!");
    
    const history = JSON.parse(localStorage.getItem("cyber_match_history") || "[]");
    history.unshift({ id: Date.now(), team1: team1Name, team2: team2Name, score1, score2, createdAt: new Date().toISOString() });
    localStorage.setItem("cyber_match_history", JSON.stringify(history));

    let players = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    const isT1Win = score1 > score2; const isT2Win = score2 > score1; const isDraw = score1 === score2;
    const t1Names = team1Name.split(" & ").map(n => n.trim());
    const t2Names = team2Name.split(" & ").map(n => n.trim());

    players = players.map((p: any) => {
      if (t1Names.includes(p.name)) {
        let eloChange = isDraw ? 0 : (isT1Win ? 10 : -5);
        let newStreak = isT1Win ? (p.winstreak || 0) + 1 : (isDraw ? (p.winstreak || 0) : 0);
        return { ...p, wins: isT1Win ? p.wins + 1 : p.wins, losses: (!isT1Win && !isDraw) ? p.losses + 1 : p.losses, elo: (p.elo || 1000) + eloChange, winstreak: newStreak };
      }
      if (t2Names.includes(p.name)) {
        let eloChange = isDraw ? 0 : (isT2Win ? 10 : -5);
        let newStreak = isT2Win ? (p.winstreak || 0) + 1 : (isDraw ? (p.winstreak || 0) : 0);
        return { ...p, wins: isT2Win ? p.wins + 1 : p.wins, losses: (!isT2Win && !isDraw) ? p.losses + 1 : p.losses, elo: (p.elo || 1000) + eloChange, winstreak: newStreak };
      }
      return p;
    });
    localStorage.setItem("cyber_players", JSON.stringify(players));
    
    alert(`✅ LƯU THÀNH CÔNG!\nĐã cập nhật hệ số Elo và Chuỗi thắng.`);
    setScore1(0); setScore2(0);
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className={`min-h-[100dvh] w-full bg-[#050505] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000] flex flex-col items-center justify-center select-none font-sans uppercase ${isTvMode ? 'p-0 overflow-hidden' : 'p-2 md:p-4 pb-12 overflow-y-auto'}`}>
      
      {isTvMode && (
        <button onClick={() => setIsTvMode(false)} className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/50 hover:bg-[#ff003c] text-white px-6 py-2 rounded-full font-black border border-gray-600 hover:border-[#ff003c] transition-all backdrop-blur-md opacity-30 hover:opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          ❌ THOÁT TV
        </button>
      )}

      <div id="scoreboard-zone" className={`flex flex-col items-center justify-center w-full ${isTvMode ? 'h-[100dvh] max-w-none' : 'max-w-md landscape:max-w-4xl gap-4 landscape:gap-3 my-auto pt-6'}`}>
        
        {!isTvMode && (
          <div className="w-full flex justify-between items-center px-2 mb-2">
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c] tracking-[0.2em] relative">
              CYBER BADMINTON
              {isListening && <span className="absolute -top-2 -right-4 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            </h1>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={toggleMic} className={`px-3 py-1 rounded text-xs font-black tracking-widest border transition-all touch-manipulation flex items-center gap-1 ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-black border-gray-700 text-gray-500'}`}>
                🎙️ {isListening ? "ĐANG NGHE" : "MIC"}
              </button>
              
              <button onClick={() => setIsTvMode(true)} className="bg-[#b537f2] text-white px-3 py-1 rounded text-xs font-black tracking-widest shadow-[0_0_8px_rgba(181,55,242,0.3)] touch-manipulation">
                📺 TV MODE
              </button>
              <button onClick={() => { vibrate(50); setVoiceEnabled(!voiceEnabled); }} className={`px-3 py-1 rounded text-xs font-black tracking-widest border transition-all touch-manipulation ${voiceEnabled ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-black border-gray-700 text-gray-500'}`}>
                {voiceEnabled ? "🔊 AI" : "🔇 AI"}
              </button>
            </div>
          </div>
        )}

        <div className={`flex flex-row w-full relative z-10 ${isTvMode ? 'h-full gap-0' : 'gap-3 landscape:gap-6'}`}>
          <div className={`flex-1 flex flex-col items-center bg-[#0d0d0d] relative overflow-hidden ${isTvMode ? 'border-r-4 border-[#ff003c]' : 'border border-[#ff003c] rounded-xl p-2 sm:p-3 justify-center'}`}>
            <input type="text" value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} className={`w-full bg-transparent text-[#ff003c] font-black tracking-widest text-center focus:outline-none focus:bg-[#ff003c20] transition-all border-b border-transparent focus:border-[#ff003c] ${isTvMode ? 'text-[min(6vw,6vh)] pt-10 pb-4' : 'text-base sm:text-xl landscape:text-2xl h-10 rounded'}`} />
            <div className={`leading-none font-black text-[#ff003c] cursor-pointer active:scale-[0.95] transition-transform w-full touch-manipulation flex items-center justify-center ${isTvMode ? 'flex-1 text-[min(45vw,70vh)] pb-16' : 'flex-1 text-[110px] sm:text-[130px] landscape:text-[100px] my-4 landscape:my-1'}`} onClick={() => handleScore1Change(score1 + 1)}>
              {score1}
            </div>
            {!isTvMode && (
              <button onClick={() => { vibrate(30); setScore1(s => Math.max(0, s - 1)); }} className="w-full bg-[#1a0006] active:opacity-50 border border-[#ff003c] text-[#ff003c] px-2 py-2 rounded font-bold tracking-wider text-xs sm:text-sm flex items-center justify-center touch-manipulation">Trừ 1</button>
            )}
          </div>

          <div className={`flex-1 flex flex-col items-center bg-[#0d0d0d] relative overflow-hidden ${isTvMode ? '' : 'border border-[#00f3ff] rounded-xl p-2 sm:p-3 justify-center'}`}>
            <input type="text" value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} className={`w-full bg-transparent text-[#00f3ff] font-black tracking-widest text-center focus:outline-none focus:bg-[#00f3ff20] transition-all border-b border-transparent focus:border-[#00f3ff] ${isTvMode ? 'text-[min(6vw,6vh)] pt-10 pb-4' : 'text-base sm:text-xl landscape:text-2xl h-10 rounded'}`} />
            <div className={`leading-none font-black text-[#00f3ff] cursor-pointer active:scale-[0.95] transition-transform w-full touch-manipulation flex items-center justify-center ${isTvMode ? 'flex-1 text-[min(45vw,70vh)] pb-16' : 'flex-1 text-[110px] sm:text-[130px] landscape:text-[100px] my-4 landscape:my-1'}`} onClick={() => handleScore2Change(score2 + 1)}>
              {score2}
            </div>
            {!isTvMode && (
              <button onClick={() => { vibrate(30); setScore2(s => Math.max(0, s - 1)); }} className="w-full bg-[#001a1a] active:opacity-50 border border-[#00f3ff] text-[#00f3ff] px-2 py-2 rounded font-bold tracking-wider text-xs sm:text-sm flex items-center justify-center touch-manipulation">Trừ 1</button>
            )}
          </div>
        </div>
      </div>

      {!isTvMode && (
        <div className="flex flex-col w-full max-w-md landscape:max-w-4xl gap-3 landscape:gap-3 relative z-50 pb-6 mt-4">
          
          {showPosterBtn && (
             <button onClick={capturePoster} className="w-full bg-gradient-to-r from-[#ff003c] to-[#00f3ff] text-white font-black py-4 rounded-xl flex justify-center items-center text-lg tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse">
               📸 LƯU POSTER KẾT QUẢ 📸
             </button>
          )}

          <div className="flex flex-col landscape:flex-row gap-3">
            <Link href="/matchmaking" onClick={() => vibrate(30)} className="flex-1 bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] font-black py-4 rounded flex justify-center items-center text-lg touch-manipulation">⚡ RẢI KÈO</Link>
            <button onClick={saveMatch} className="flex-1 bg-[#0d0d0d] border border-[#39ff14] text-[#39ff14] font-black py-4 rounded flex justify-center items-center text-lg touch-manipulation">💾 LƯU TRẬN</button>
          </div>
          <div className="flex flex-col landscape:flex-row gap-3">
            <div className="flex flex-row flex-1 gap-3">
              <button onClick={resetScores} className="flex-1 bg-[#0d0d0d] border border-[#ff003c] text-[#ff003c] font-black py-3 rounded flex justify-center items-center text-sm touch-manipulation">🔄 RESET</button>
              <Link href="/analytics" onClick={() => vibrate(30)} className="flex-1 bg-[#0d0d0d] border border-[#00f3ff] text-[#00f3ff] font-black py-3 rounded flex justify-center items-center text-sm touch-manipulation">THỐNG KÊ 📈</Link>
            </div>
            <div className="flex flex-row flex-1 gap-3">
              <Link href="/history" onClick={() => vibrate(30)} className="flex-1 bg-[#0d0d0d] border border-[#b537f2] text-[#b537f2] font-black py-3 rounded flex justify-center items-center text-sm touch-manipulation">LỊCH SỬ 📊</Link>
              <Link href="/finance" onClick={() => vibrate(30)} className="flex-1 bg-[#0d0d0d] border border-[#fcee0a] text-[#fcee0a] font-black py-3 rounded flex justify-center items-center text-sm touch-manipulation">💰 TÀI CHÍNH</Link>
            </div>
          </div>
          <Link href="/settings" onClick={() => vibrate(30)} className="w-full bg-[#0d0d0d] border border-gray-400 text-gray-400 font-black py-3 rounded flex justify-center items-center text-sm touch-manipulation mt-1">SYSTEM ⚙️</Link>
        </div>
      )}
    </div>
  );
}