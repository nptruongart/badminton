"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [players, setPlayers] = useState<{ id: number; name: string }[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [maxScore, setMaxScore] = useState(21);
  const [shuttlePrice, setShuttlePrice] = useState(15000);

  // Load danh sách thành viên khi vào trang
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thành viên:", error);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name: newPlayerName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPlayerName("");
        fetchPlayers(); // Cập nhật lại danh sách
      }
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
    }
  };

  const deletePlayer = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá thành viên này?")) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPlayers();
      }
    } catch (error) {
      console.error("Lỗi xoá thành viên:", error);
    }
  };

  const deleteAllPlayers = async () => {
    if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XOÁ TOÀN BỘ thành viên không?")) return;
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAll" }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayers([]); // Xóa sạch trên màn hình
      }
    } catch (error) {
      console.error("Lỗi khi xoá toàn bộ:", error);
    }
  };

  const saveConfig = () => {
    alert("Đã lưu cấu hình thành công!");
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white p-4 font-sans">
      {/* Header Menu */}
      <div className="max-w-2xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-4">
        <h1 className="text-xl md:text-2xl font-bold text-red-500">⚙ Cài Đặt CLB & Thành Viên</h1>
        <div className="flex gap-2">
          <Link href="/matchmaking" className="bg-purple-300 text-purple-900 font-bold px-4 py-2 rounded-lg shadow hover:bg-purple-400 transition">
            🎲 Ghép Kèo
          </Link>
          <Link href="/finance" className="bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-lg shadow hover:bg-yellow-500 transition">
            💰 Tính Tiền
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Box Quản lý Thành Viên */}
        <div className="bg-[#1e1e1e] p-4 md:p-6 rounded-xl shadow-lg border border-gray-800">
          <h2 className="text-green-500 font-bold mb-4 flex items-center gap-2">
            👥 Danh sách Thành viên CLB (Đồng bộ Ghép Kèo & Tính Tiền)
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Nhập tên thành viên mới..."
              className="flex-1 bg-[#2a2a2a] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-2">
              <button
                onClick={addPlayer}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg transition"
              >
                + Thêm
              </button>
              <button
                onClick={deleteAllPlayers}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition"
              >
                🗑️ Xoá hết
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {players.map((player) => (
              <div key={player.id} className="bg-[#2a2a2a] border border-gray-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                <span className="font-semibold text-gray-200">{player.name}</span>
                <button 
                  onClick={() => deletePlayer(player.id)}
                  className="text-red-400 hover:text-red-500 font-bold ml-1 text-lg leading-none"
                  title="Xoá thành viên này"
                >
                  ×
                </button>
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-gray-500 italic text-sm">Chưa có thành viên nào. Hãy thêm ở trên.</p>
            )}
          </div>
        </div>

        {/* Box Cấu hình */}
        <div className="bg-[#1e1e1e] p-4 md:p-6 rounded-xl shadow-lg border border-gray-800">
          <h2 className="text-yellow-500 font-bold mb-4 flex items-center gap-2">
            💰 Cấu hình Tài Chính & Trận Đấu
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-400 text-sm mb-1">🏁 Điểm số tối đa (Mặc định 21):</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full bg-[#2a2a2a] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">🏸 Giá tiền mặc định 1 quả cầu (VNĐ):</label>
              <input
                type="number"
                value={shuttlePrice}
                onChange={(e) => setShuttlePrice(Number(e.target.value))}
                className="w-full bg-[#2a2a2a] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <button 
            onClick={saveConfig}
            className="w-full bg-[#2ed573] hover:bg-[#27ae60] text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition text-lg"
          >
            💾 Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
}