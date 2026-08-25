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
    // Lấy danh sách thành viên từ DB
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlayers(data.players);
          setPresentPlayers(data.players.map((p: Player) => p.name));
        }
        setLoading(false);
      })
      .catch(err => console.error("Lỗi tải người chơi:", err));

    // Khôi phục danh sách trận đấu đang dở (nếu có)
    const savedMatches = localStorage.getItem("savedCurrentMatches");
    if (savedMatches) {
      try {
        setMatches(JSON.parse(savedMatches));
      } catch (e) {
        console.error(e);
      }
    }

    // 📥 KHÔI PHỤC DANH SÁCH SÂN ĐÃ LƯU TRƯỚC ĐÓ
    const savedCourts = localStorage.getItem("savedCourtInput");
    if (savedCourts) {
      setCourtInput(savedCourts);
    }
  }, []);

  // 💾 TỰ ĐỘNG LƯU MỖI KHI NGƯỜI DÙNG THAY ĐỔI TÊN SÂN
  const handleCourtInputChange = (val: string) => {
    setCourtInput(val);
    localStorage.setItem("savedCourtInput", val);
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.trim()) return;
    const name = newPlayer.trim();
    if (players.some(p => p.name === name)) return alert("Tên đã tồn tại!");

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
      alert("Lỗi thêm người chơi!");
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
      alert("Cần ít nhất 4 người có mặt để ghép kèo đôi!");
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
      const powerScore = p.elo + winRate * 200;
      return { ...p, powerScore };
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
        if (score < minScore) {
          minScore = score;
          bestPartnerIdx = i;
        }
      }

      const p2 = pool.splice(bestPartnerIdx, 1)[0];
      const team1 = [p1.name, p2.name];
      const team1Power = p1.powerScore + p2.powerScore;

      let bestIndices = [0, 1];
      let minDiff = Infinity;

      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          const o1 = pool[i];
          const o2 = pool[j];
          const diff = Math.abs(team1Power - (o1.powerScore + o2.powerScore));
          if (diff < minDiff) {
            minDiff = diff;
            bestIndices = [i, j];
          }
        }
      }

      const o2 = pool.splice(bestIndices[1], 1)[0];
      const o1 = pool.splice(bestIndices[0], 1)[0];
      const team2 = [o1.name, o2.name];

      rawMatches.push({ team1, team2 });
      playedThisRound.push(p1.name, p2.name, o1.name, o2.name);

      const key1 = [team1[0], team1[1]].sort().join("-");
      const key2 = [team2[0], team2[1]].sort().join("-");
      setHistoryPairs(prev => ({
        ...prev,
        [key1]: (prev[key1] || 0) + 1,
        [key2]: (prev[key2] || 0) + 1
      }));
    }

    const assignedMatches = rawMatches.map((m, idx) => ({
      ...m,
      court: availableCourts[idx % availableCourts.length]
    }));

    const nextWaitingQueue = activeNames.filter(name => !playedThisRound.includes(name));
    setMatches(assignedMatches);
    setSittingOut(nextWaitingQueue);
    setWaitingQueue(nextWaitingQueue);

    localStorage.setItem("savedCurrentMatches", JSON.stringify(assignedMatches));
  };

  // 🚀 ĐÂY LÀ CHỖ TÔI ĐÃ SỬA: Đóng gói tên 2 đội bắn thẳng qua URL cho Bảng Điểm
  const sendToScoreboard = (team1: string[], team2: string[]) => {
    const t1 = encodeURIComponent(team1.join(" & "));
    const t2 = encodeURIComponent(team2.join(" & "));
    router.push(`/?t1=${t1}&t2=${t2}`);
  };

  const copyMatchesToClipboard = () => {
    if (matches.length === 0) return alert("Chưa có trận nào để chia sẻ!");
    let text = "🏸 DANH SÁCH KÈO CẦU LÔNG HÔM NAY:\n";
    matches.forEach((m, idx) => {
      text += `👉 Trận ${idx + 1} (${m.court}): ${m.team1.join(" & ")} vs ${m.team2.join(" & ")}\n`;
    });
    if (sittingOut.length > 0) {
      text += `⏳ Dự bị nghỉ vòng này: ${sittingOut.join(", ")}`;
    }
    navigator.clipboard.writeText(text);
    alert("Đã copy danh sách kèo! Fen dán vào nhóm Zalo cho anh em xem nhé! 🚀");
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'white', backgroundColor: '#111', minHeight: '100vh' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, color: '#9c88ff', fontSize: '1.5rem' }}>⚡ Ghép Kèo Đa Sân & Chia Sẻ</h1>
        <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          ⬅ Trang Chủ
        </Link>
      </div>

      {/* KHU VỰC ĐIỀU KHIỂN CHÍNH */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#2ed573', fontSize: '1.2rem' }}>✅ Điểm danh & Cấu hình sân</h2>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#feca57', marginBottom: '6px', fontSize: '0.9rem' }}>
              🏸 Danh sách sân (cách nhau dấu phẩy):
            </label>
            <input 
              type="text" 
              value={courtInput} 
              onChange={(e) => handleCourtInputChange(e.target.value)} 
              placeholder="VD: Sân 2, Sân 5, Sân 7" 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#333', color: 'white', border: '1px solid #555', fontSize: '1rem', fontWeight: 'bold' }} 
            />
          </div>

          <div style={{ flex: 2, minWidth: '300px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <input 
              value={newPlayer} 
              onChange={(e) => setNewPlayer(e.target.value)} 
              placeholder="Thêm tay vợt mới..." 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#333', color: 'white', fontSize: '1rem' }} 
            />
            <button onClick={handleAddPlayer} style={{ padding: '12px 20px', backgroundColor: '#2ed573', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Thêm</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {players.map(p => {
            const isPresent = presentPlayers.includes(p.name);
            return (
              <button 
                key={p.name} 
                onClick={() => toggleAttendance(p.name)}
                style={{ 
                  padding: '10px 18px', borderRadius: '30px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                  backgroundColor: isPresent ? '#2ed573' : '#444', color: isPresent ? 'black' : '#888'
                }}
              >
                {p.name} {isPresent ? '✔' : '✖'}
              </button>
            );
          })}
        </div>

        <button onClick={generateFairMatches} style={{ width: '100%', padding: '15px', backgroundColor: '#9c88ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}>
          🎰 RẢI KÈO PHÂN BỔ ĐA SÂN
        </button>
      </div>

      {/* DANH SÁCH TRẬN ĐẤU */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, color: '#ff4757', fontSize: '1.2rem' }}>🏸 Danh sách Trận Đấu Đang Sẵn Sàng</h2>
          {matches.length > 0 && (
            <button 
              onClick={copyMatchesToClipboard}
              style={{ padding: '10px 15px', backgroundColor: '#00d2d3', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              📋 Copy Kèo Gửi Zalo
            </button>
          )}
        </div>
        
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '30px 0', fontSize: '1.1rem' }}>
            Chưa có kèo nào. Bấm nút "Rải Kèo Phân Bổ Đa Sân" ở trên để tạo trận!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {matches.map((match, idx) => (
              <div key={idx} style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#feca57', fontSize: '1.1rem' }}>Trận {idx + 1}</h3>
                  <span style={{ backgroundColor: '#ff4757', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📍 {match.court}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: '#ff4757' }}>
                    {match.team1.join(' & ')}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#888' }}>VS</div>
                  <div style={{ flex: 1, textAlign: 'left', fontSize: '1.1rem', fontWeight: 'bold', color: '#1e90ff' }}>
                    {match.team2.join(' & ')}
                  </div>
                </div>

                <button 
                  onClick={() => sendToScoreboard(match.team1, match.team2)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#ffa502', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  ⚡ Đưa lên Bảng Điểm ({match.court})
                </button>
              </div>
            ))}
          </div>
        )}

        {sittingOut.length > 0 && (
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#333', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#aaa', fontSize: '0.95rem' }}>⏳ Hàng ghế dự bị (Vòng sau):</h3>
            <div style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
              {sittingOut.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* BẢNG XẾP HẠNG ELO */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px' }}>
        <h2 style={{ marginTop: 0, color: '#feca57', fontSize: '1.2rem' }}>📊 Bảng Xếp Hạng & Thống Kê Elo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {players.map(p => {
            const total = p.wins + p.losses;
            const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
            return (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '12px 15px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                    <span style={{ color: '#2ed573', fontWeight: 'bold' }}>{p.wins}W</span>-<span style={{ color: '#ff4757', fontWeight: 'bold' }}>{p.losses}L</span> 
                    <span style={{ color: '#feca57', marginLeft: '4px' }}>({winRate}%)</span>
                  </div>
                  <span style={{ backgroundColor: '#333', padding: '5px 8px', borderRadius: '4px', color: '#00d2d3', fontWeight: 'bold', fontSize: '0.85rem' }}>Elo: {p.elo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}