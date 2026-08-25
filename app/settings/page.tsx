"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Player {
  name: string;
  elo: number;
  wins: number;
  losses: number;
}

export default function SettingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [maxScore, setMaxScore] = useState("21");
  const [shuttlePrice, setShuttlePrice] = useState("22000");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Lấy danh sách thành viên từ Database qua API
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlayers(data.players);
      });

    const sMax = localStorage.getItem("setting_maxScore");
    const sPrice = localStorage.getItem("setting_shuttlePrice");
    if (sMax) setMaxScore(sMax);
    if (sPrice) setShuttlePrice(sPrice);
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayer.trim()) return;
    const name = newPlayer.trim();
    if (players.some(p => p.name === name)) return alert("Tên đã tồn tại!");
    const deleteAllPlayers = async () => {
    if (!confirm("⚠️ Bạn có chắc chắn muốn XOÁ TOÀN BỘ thành viên không?")) return;
    
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteAll' }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayers([]); // Xóa sạch danh sách trên màn hình ngay lập tức
      }
    } catch (error) {
      console.error("Lỗi khi xoá toàn bộ:", error);
    }
  };

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "add", newName: name })
    });
    const data = await res.json();
    if (data.success) {
      setPlayers(data.players);
      setNewPlayer("");
    }
  };

  const handleRemovePlayer = async (nameToRemove: string) => {
    if (!confirm(`Xóa ${nameToRemove} khỏi CLB?`)) return;
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "remove", nameToRemove })
    });
    const data = await res.json();
    if (data.success) {
      setPlayers(data.players);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem("setting_maxScore", maxScore);
    localStorage.setItem("setting_shuttlePrice", shuttlePrice);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, color: '#ff4757', fontSize: '1.5rem' }}>⚙ Cài Đặt CLB & Thành Viên</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/matchmaking" style={{ padding: '10px 15px', backgroundColor: '#9c88ff', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            🎲 Ghép Kèo
          </Link>
          <Link href="/finance" style={{ padding: '10px 15px', backgroundColor: '#feca57', color: 'black', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            💰 Tính Tiền
          </Link>
        </div>
      </div>

      {/* KHU VỰC 1: QUẢN LÝ DANH SÁCH THÀNH VIÊN GỐC */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#2ed573', fontSize: '1.2rem' }}>👥 Danh sách Thành viên CLB (Đồng bộ Ghép Kèo & Tính Tiền)</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input 
            value={newPlayer} 
            onChange={(e) => setNewPlayer(e.target.value)} 
            placeholder="Nhập tên thành viên mới..." 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#333', color: 'white', fontSize: '1rem' }} 
          />
          <button onClick={handleAddPlayer} style={{ padding: '12px 20px', backgroundColor: '#2ed573', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Thêm</button><div className="flex gap-2 mb-4">
  <input 
    type="text" 
    placeholder="Nhập tên thành viên mới..." 
    // ... các code cũ của fen giữ nguyên
  />
  <button onClick={addPlayer} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
    + Thêm
  </button>
  
  {/* NÚT XOÁ HẾT MỚI THÊM VÀO ĐÂY */}
  <button onClick={deleteAllPlayers} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
    🗑️ Xoá hết
  </button>
</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {players.map(p => (
            <span key={p.name} style={{ backgroundColor: '#111', padding: '8px 15px', borderRadius: '20px', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              {p.name} 
              <span onClick={() => handleRemovePlayer(p.name)} style={{ color: '#ff4757', cursor: 'pointer', fontSize: '1.1rem' }}>×</span>
            </span>
          ))}
        </div>
      </div>

      {/* KHU VỰC 2: CÀI ĐẶT THÔNG SỐ (GIÁ CẦU, ĐIỂM SỐ) */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ marginTop: 0, color: '#feca57', fontSize: '1.2rem' }}>💰 Cấu hình Tài Chính & Trận Đấu</h2>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#aaa', marginBottom: '6px' }}>🏁 Điểm số tối đa (Mặc định 21):</label>
          <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#aaa', marginBottom: '6px' }}>🏸 Giá tiền mặc định 1 quả cầu (VNĐ):</label>
          <input type="number" value={shuttlePrice} onChange={(e) => setShuttlePrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
        </div>

        <button onClick={handleSaveConfig} style={{ width: '100%', padding: '15px', backgroundColor: '#2ed573', color: 'black', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          💾 Lưu Cấu Hình
        </button>

        {saved && <div style={{ textAlign: 'center', color: '#2ed573', fontWeight: 'bold' }}>🎉 Đã lưu cấu hình thành công!</div>}
      </div>
    </div>
  );
}