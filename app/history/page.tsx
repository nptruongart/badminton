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
  const [filterText, setFilterText] = useState(""); // State cho bộ lọc
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

  // Xử lý Xóa toàn bộ lịch sử
  const clearHistory = async () => {
    if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa SẠCH toàn bộ lịch sử trận đấu không? Hành động này không thể hoàn tác!")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/matches', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMatches([]);
        alert("Đã xóa sạch lịch sử trận đấu!");
      } else {
        alert("Lỗi khi xóa lịch sử!");
      }
    } catch (error) {
      alert("Mất kết nối đến máy chủ!");
    }
    setIsDeleting(false);
  };

  // Logic Lọc (Filter) theo tên tay vợt
  const filteredMatches = matches.filter(match => 
    match.team1.toLowerCase().includes(filterText.toLowerCase()) || 
    match.team2.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white p-4 font-sans pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6 mt-4 border-b border-gray-800 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-[#1890ff] flex items-center gap-2">
          📊 Lịch Sử
        </h1>
        <Link href="/" className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg font-bold transition">
          ⬅ Về trang chủ
        </Link>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* THANH TÌM KIẾM & NÚT XÓA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="🔍 Nhập tên người chơi để lọc kèo..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 bg-[#222] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#1890ff]"
          />
          <button 
            onClick={clearHistory}
            disabled={isDeleting || matches.length === 0}
            className={`px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap ${
              matches.length === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isDeleting ? "Đang xóa..." : "🗑️ Xóa Lịch Sử"}
          </button>
        </div>

        {/* DANH SÁCH TRẬN ĐẤU */}
        {loading ? (
          <div className="text-center text-gray-500 py-10 animate-pulse">
            ⏳ Đang tải dữ liệu lịch sử...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center bg-[#1e1e1e] p-10 rounded-xl border border-gray-800 text-gray-500">
            {matches.length === 0 
              ? "Chưa có trận đấu nào được lưu. Hãy ra sân và ghi điểm nhé! 🏸" 
              : "Không tìm thấy trận đấu nào của tay vợt này."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match.id} className="bg-[#1e1e1e] p-4 md:p-5 rounded-xl shadow-lg border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gray-600 transition">
                
                {/* Cột thời gian */}
                <div className="text-gray-500 text-sm md:w-1/4 text-center md:text-left">
                  {new Date(match.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </div>

                {/* Cột Tỷ số */}
                <div className="flex items-center justify-center gap-4 flex-1 w-full">
                  {/* Đội 1 */}
                  <div className="flex-1 text-right">
                    <div className={`font-bold text-lg ${match.score1 > match.score2 ? 'text-green-500' : 'text-gray-300'}`}>
                      {match.team1}
                    </div>
                  </div>

                  {/* Điểm số */}
                  <div className="bg-[#2a2a2a] px-4 py-2 rounded-lg font-black text-xl tracking-widest min-w-[100px] text-center border border-gray-700 shadow-inner">
                    <span className={match.score1 > match.score2 ? 'text-green-500' : 'text-white'}>{match.score1}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span className={match.score2 > match.score1 ? 'text-green-500' : 'text-white'}>{match.score2}</span>
                  </div>

                  {/* Đội 2 */}
                  <div className="flex-1 text-left">
                    <div className={`font-bold text-lg ${match.score2 > match.score1 ? 'text-green-500' : 'text-gray-300'}`}>
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