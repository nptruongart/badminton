"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Trạng thái ô tìm kiếm

  const fetchMatches = () => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMatches(data.matches);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải lịch sử:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDeleteAllHistory = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đấu không? Hành động này không thể hoàn tác!")) return;

    try {
      const res = await fetch('/api/matches', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMatches([]);
        alert("Đã dọn sạch lịch sử thi đấu! 🧹");
      } else {
        alert("Có lỗi xảy ra khi xóa lịch sử!");
      }
    } catch (error) {
      alert("Mất kết nối đến Server!");
    }
  };

  // 🔍 THUẬT TOÁN LỌC TÌM KIẾM THEO TÊN THÀNH VIÊN HOẶC NGÀY THÁNG
  const filteredMatches = matches.filter(match => {
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(match.createdAt).toLocaleDateString('vi-VN'); // Định dạng Ngày/Tháng/Năm
    return (
      match.teamAName.toLowerCase().includes(term) ||
      match.teamBName.toLowerCase().includes(term) ||
      dateStr.includes(term)
    );
  });

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        Đang tải lịch sử đấu...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, color: '#1e90ff', fontSize: '1.5rem' }}>📊 Lịch Sử Thi Đấu & Tra Cứu</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {matches.length > 0 && (
            <button 
              onClick={handleDeleteAllHistory}
              style={{ padding: '10px 15px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🗑 Xoá Lịch Sử
            </button>
          )}
          <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            ⬅ Trang Chủ
          </Link>
        </div>
      </div>

      {/* 🔍 Ô TÌM KIẾM / LỌC KÈO */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="🔍 Tìm kiếm theo tên tay vợt hoặc ngày (VD: Lien, 25/06)..." 
          style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#222', color: 'white', border: '1px solid #555', fontSize: '1rem', fontWeight: 'bold' }} 
        />
      </div>

      {filteredMatches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '50px 0', fontSize: '1.2rem' }}>
          {matches.length === 0 ? "Chưa có trận đấu nào được lưu trong Database!" : "Không tìm thấy trận đấu phù hợp với từ khóa này!"}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredMatches.map((match) => {
            // Hiển thị chi tiết Ngày, Tháng, Năm và Giờ chuẩn tiếng Việt
            const dateObj = new Date(match.createdAt);
            const timeFormatted = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const dateFormatted = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const isTeamAWon = match.scoreA > match.scoreB;
            const isTeamBWon = match.scoreB > match.scoreA;

            return (
              <div key={match.id} style={{ backgroundColor: '#222', padding: '15px 20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  {/* Nhãn Ngày Tháng Năm rõ ràng */}
                  <div style={{ fontSize: '0.85rem', color: '#feca57', marginBottom: '5px', fontWeight: 'bold' }}>
                    📅 Ngày {dateFormatted} - ⏰ {timeFormatted}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span style={{ color: isTeamAWon ? '#2ed573' : '#ff4757' }}>{match.teamAName}</span>
                    <span style={{ color: '#fff', margin: '0 10px' }}>VS</span>
                    <span style={{ color: isTeamBWon ? '#2ed573' : '#1e90ff' }}>{match.teamBName}</span>
                  </div>
                </div>

                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', backgroundColor: '#111', padding: '8px 20px', borderRadius: '8px', border: '1px solid #444' }}>
                  <span style={{ color: '#ff4757' }}>{match.scoreA}</span>
                  <span style={{ color: '#888', margin: '0 8px' }}>-</span>
                  <span style={{ color: '#1e90ff' }}>{match.scoreB}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}