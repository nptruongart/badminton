"use client";
import { useState, useEffect } from "react";
import Link from "next/link"; 

export default function Home() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [nameA, setNameA] = useState("ĐỘI 1");
  const [nameB, setNameB] = useState("ĐỘI 2");

  useEffect(() => {
    const savedMatch = localStorage.getItem("currentMatchTeams");
    if (savedMatch) {
      try {
        const { nameA: syncedNameA, nameB: syncedNameB } = JSON.parse(savedMatch);
        if (syncedNameA) setNameA(syncedNameA);
        if (syncedNameB) setNameB(syncedNameB);
        localStorage.removeItem("currentMatchTeams");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const addScore = (team: 'A' | 'B') => {
    if (team === 'A') setScoreA(scoreA + 1);
    if (team === 'B') setScoreB(scoreB + 1);
  };

  const subScore = (team: 'A' | 'B') => {
    if (team === 'A' && scoreA > 0) setScoreA(scoreA - 1);
    if (team === 'B' && scoreB > 0) setScoreB(scoreB - 1);
  };

  const resetMatch = () => {
    if (confirm("Bạn có chắc muốn làm mới tỉ số không?")) {
      setScoreA(0);
      setScoreB(0);
    }
  };

  const saveMatch = async () => {
    if (scoreA === scoreB) {
      alert("Tỉ số hòa không thể tính thắng thua cho Elo!");
      return;
    }

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAName: nameA,
          teamBName: nameB,
          scoreA: scoreA,
          scoreB: scoreB
        })
      });

      if (response.ok) {
        alert(`Đã lưu kết quả vào Lịch sử & Cập nhật Elo thành công!\n${nameA}: ${scoreA} - ${nameB}: ${scoreB}`);
        setScoreA(0); 
        setScoreB(0); 
      } else {
        alert("Có lỗi xảy ra khi lưu vào Database!");
      }
    } catch (error) {
      alert("Mất kết nối đến Server!");
    }
  };

  return (
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#111', color: 'white', userSelect: 'none', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        @media (max-width: 768px) {
          .scoreboards-wrapper {
            flex-direction: column !important;
          }
          .team-box {
            border-right: none !important;
            border-bottom: 2px solid #333 !important;
            padding: 10px 0 !important;
          }
          .score-number {
            font-size: 7rem !important;
          }
          .nav-buttons {
            flex-direction: column !important;
            gap: 10px !important;
            padding: 10px !important;
          }
          .nav-buttons a, .nav-buttons button {
            width: 100% !important;
            justify-content: center !important;
            font-size: 1rem !important;
            padding: 12px !important;
          }
        }
      `}</style>

      <div style={{ textAlign: 'center', padding: '15px', background: '#222', fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #333' }}>
        🏆 Bảng Đếm Điểm Cầu Lông
      </div>

      <div className="scoreboards-wrapper" style={{ display: 'flex', flex: 1 }}>
        {/* Đội A */}
        <div className="team-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: '2px solid #333' }}>
          <input 
            value={nameA} 
            onChange={(e) => setNameA(e.target.value)} 
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed #555', color: '#ff4757', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: '80%', marginBottom: '10px' }} 
          />
          <div className="score-number" onClick={() => addScore('A')} style={{ fontSize: '10rem', fontWeight: 'bold', color: '#ff4757', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center' }}>
            {scoreA}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => subScore('A')} style={{ background: '#333', color: 'white', border: 'none', padding: '12px 25px', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer' }}>Trừ 1 điểm</button>
          </div>
        </div>

        {/* Đội B */}
        <div className="team-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <input 
            value={nameB} 
            onChange={(e) => setNameB(e.target.value)} 
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed #555', color: '#1e90ff', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: '80%', marginBottom: '10px' }} 
          />
          <div className="score-number" onClick={() => addScore('B')} style={{ fontSize: '10rem', fontWeight: 'bold', color: '#1e90ff', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center' }}>
            {scoreB}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => subScore('B')} style={{ background: '#333', color: 'white', border: 'none', padding: '12px 25px', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer' }}>Trừ 1 điểm</button>
          </div>
        </div>
      </div>

      {/* MENU ĐIỀU HƯỚNG */}
      <div className="nav-buttons" style={{ padding: '15px', textAlign: 'center', background: '#222', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={resetMatch} style={{ background: '#ff4757', color: 'white', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', border: 'none', fontSize: '1.1rem', cursor: 'pointer' }}>
          🔄 LÀM MỚI
        </button>
        <button onClick={saveMatch} style={{ background: '#2ed573', color: 'black', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', border: 'none', fontSize: '1.1rem', cursor: 'pointer' }}>
          💾 LƯU TRẬN
        </button>
        <Link href="/history" style={{ background: '#1e90ff', color: 'white', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          📊 LỊCH SỬ
        </Link>
        <Link href="/finance" style={{ background: '#feca57', color: 'black', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          💰 TÍNH TIỀN
        </Link>
        <Link href="/matchmaking" style={{ background: '#9c88ff', color: 'white', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🎲 GHÉP KÈO
        </Link>
        <Link href="/settings" style={{ background: '#747d8c', color: 'white', fontWeight: 'bold', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⚙ CÀI ĐẶT
        </Link>
      </div>
    </div>
  );
}