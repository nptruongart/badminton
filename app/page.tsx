"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  // Khai báo sẵn chỗ chứa tên 2 đội
  const [team1Name, setTeam1Name] = useState("ĐỘI 1");
  const [team2Name, setTeam2Name] = useState("ĐỘI 2");

  // Tự động chộp lấy tên đội từ trang Ghép Kèo ném sang
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t1 = params.get("t1");
    const t2 = params.get("t2");

    if (t1) setTeam1Name(decodeURIComponent(t1));
    if (t2) setTeam2Name(decodeURIComponent(t2));
  }, []);

  const resetScores = () => {
    if (confirm("Bạn có chắc muốn làm mới điểm số?")) {
      setScore1(0);
      setScore2(0);
    }
  };

  const saveMatch = async () => {
    if (score1 === 0 && score2 === 0) {
      alert("Trận đấu chưa có điểm!");
      return;
    }
    alert(`Đã lưu trận đấu: ${team1Name} (${score1}) - ${team2Name} (${score2})`);
    setScore1(0);
    setScore2(0);
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center pt-6 pb-10 select-none font-sans">
      
      <h1 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
        🏆 Bảng Đếm Điểm Cầu Lông
      </h1>

      {/* KHUNG ĐIỂM SỐ NẰM NGANG */}
      <div className="flex flex-row w-full max-w-md px-2 mb-12">
        
        {/* ĐỘI 1 */}
        <div className="flex-1 flex flex-col items-center">
          {/* h-14 giúp cố định chiều cao tên, không làm lệch 2 số điểm nếu tên quá dài */}
          <h2 className="text-[#ff4d4f] text-lg md:text-xl font-bold mb-2 tracking-wide text-center h-14 flex items-center justify-center">
            {team1Name}
          </h2>
          <div className="w-3/4 border-t border-dashed border-gray-700 mb-6"></div>
          
          <div 
            className="text-[120px] sm:text-[140px] leading-none font-black text-[#ff4d4f] mb-8 cursor-pointer active:scale-95 transition-transform drop-shadow-lg"
            onClick={() => setScore1(s => s + 1)}
          >
            {score1}
          </div>
          
          <button 
            onClick={() => setScore1(s => Math.max(0, s - 1))}
            className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors border border-gray-700"
          >
            Trừ 1 điểm
          </button>
        </div>

        <div className="w-px bg-gray-800 mx-1"></div>

        {/* ĐỘI 2 */}
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-[#1890ff] text-lg md:text-xl font-bold mb-2 tracking-wide text-center h-14 flex items-center justify-center">
            {team2Name}
          </h2>
          <div className="w-3/4 border-t border-dashed border-gray-700 mb-6"></div>
          
          <div 
            className="text-[120px] sm:text-[140px] leading-none font-black text-[#1890ff] mb-8 cursor-pointer active:scale-95 transition-transform drop-shadow-lg"
            onClick={() => setScore2(s => s + 1)}
          >
            {score2}
          </div>
          
          <button 
            onClick={() => setScore2(s => Math.max(0, s - 1))}
            className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors border border-gray-700"
          >
            Trừ 1 điểm
          </button>
        </div>
      </div>

      {/* CÁC NÚT CHỨC NĂNG DƯỚI CÙNG */}
      <div className="flex flex-col gap-3 w-full max-w-md px-4 mt-auto">
        
        {/* NÚT QUAY VỀ GHÉP KÈO */}
        <Link 
          href="/matchmaking"
          className="w-full bg-[#9b59b6] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          ⚡ GHÉP KÈO TRẬN MỚI
        </Link>

        <button 
          onClick={resetScores}
          className="w-full bg-[#ff4d4f] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          🔄 LÀM MỚI ĐIỂM
        </button>

        <button 
          onClick={saveMatch}
          className="w-full bg-[#2ed573] text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          💾 LƯU TRẬN
        </button>

        <Link 
          href="/history"
          className="w-full bg-[#1890ff] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          📊 LỊCH SỬ
        </Link>

        <Link 
          href="/finance"
          className="w-full bg-[#ffd666] text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          💰 TÍNH TIỀN
        </Link>
        
        <Link 
          href="/settings"
          className="w-full bg-[#595959] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-lg active:scale-95 transition-transform"
        >
          ⚙️ CÀI ĐẶT
        </Link>
      </div>

    </div>
  );
}