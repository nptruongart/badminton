"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinancePage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<{ id: number; desc: string; amount: number }[]>([]);
  const [desc, setDesc] = useState("");
  const [amountStr, setAmountStr] = useState(""); // Đổi sang Text để không bị kẹt số 0
  const [playersCount, setPlayersCount] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedExp = JSON.parse(localStorage.getItem("cyber_expenses") || "[]");
    const players = JSON.parse(localStorage.getItem("cyber_players") || "[]");
    setExpenses(savedExp);
    setPlayersCount(players.length > 0 ? players.length : 1);
    setIsLoaded(true);
  }, []);

  const handleAdd = () => {
    const amount = Number(amountStr);
    if (!desc || isNaN(amount) || amount <= 0) return alert("Vui lòng nhập đúng thông tin!");
    
    const newExp = { id: Date.now(), desc, amount };
    const updated = [...expenses, newExp];
    setExpenses(updated);
    localStorage.setItem("cyber_expenses", JSON.stringify(updated));
    setDesc("");
    setAmountStr("");
  };

  const handleClear = () => {
    if (confirm("⚠️ Xóa toàn bộ dữ liệu thu chi?")) {
      setExpenses([]);
      localStorage.removeItem("cyber_expenses");
    }
  };

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const perPerson = Math.ceil(totalSpent / playersCount);

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans uppercase">
      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 border-b border-[#fcee0a] pb-4">
        <h1 className="text-xl font-black text-[#fcee0a] tracking-widest">TÀI CHÍNH</h1>
        <button onClick={() => router.push('/')} className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</button>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        
        {/* KHUNG HIỂN THỊ ĐÃ SỬA CHỐNG TRÀN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#ff003c]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1 break-words w-full">TỔNG CHI PHÍ</div>
            <div className="text-[#ff003c] text-xl font-black break-words w-full">{totalSpent.toLocaleString()} đ</div>
          </div>
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#39ff14]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1 break-words w-full">CHIA ĐỀU ({playersCount} NGƯỜI)</div>
            <div className="text-[#39ff14] text-xl font-black break-words w-full">{perPerson.toLocaleString()} đ</div>
          </div>
        </div>

        {/* KHUNG NHẬP LIỆU */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-gray-700">
          <h2 className="text-[#fcee0a] font-black tracking-widest mb-4">THÊM KHOẢN CHI</h2>
          <div className="flex flex-col gap-3">
            <input 
              value={desc} onChange={(e) => setDesc(e.target.value)} 
              placeholder="VD: Mua 2 ống cầu, tiền sân tháng 10..." 
              className="bg-black border border-gray-700 text-white px-4 py-3 rounded focus:border-[#fcee0a] focus:outline-none" 
            />
            <div className="flex gap-2">
              <input 
                type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} 
                placeholder="VD: 350000" 
                className="flex-1 bg-black border border-gray-700 text-white px-4 py-3 rounded focus:border-[#fcee0a] focus:outline-none" 
              />
              <button onClick={handleAdd} className="bg-[#fcee0a] text-black px-6 font-black rounded active:scale-95 touch-manipulation">LƯU</button>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d0d] p-5 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-black tracking-widest">LỊCH SỬ CHI TIÊU</h2>
            {expenses.length > 0 && (
              <button onClick={handleClear} className="text-[#ff003c] font-bold text-xs border border-[#ff003c] px-3 py-1 rounded touch-manipulation">XOÁ SẠCH</button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {expenses.length === 0 ? (
              <div className="text-gray-600 text-center py-4 font-bold">CHƯA CÓ DỮ LIỆU</div>
            ) : expenses.map(e => (
              <div key={e.id} className="flex justify-between items-center bg-black p-3 border border-gray-800 rounded">
                <span className="text-gray-300 font-bold text-sm truncate pr-2">{e.desc}</span>
                <span className="text-[#fcee0a] font-black shrink-0">{e.amount.toLocaleString()} đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}