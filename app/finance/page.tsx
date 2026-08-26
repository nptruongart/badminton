"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Expense {
  id: number;
  desc: string;
  amount: number;
  payer: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  
  const [desc, setDesc] = useState("");
  const [amountStr, setAmountStr] = useState(""); 
  const [selectedPayer, setSelectedPayer] = useState("");
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedExp = JSON.parse(localStorage.getItem("cyber_expenses") || "[]");
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]").map((p: any) => p.name);
    
    setExpenses(savedExp);
    setPlayers(savedPlayers);
    if (savedPlayers.length > 0) {
      setSelectedPayer(savedPlayers[0]);
    }
    setIsLoaded(true);
  }, []);

  const handleAdd = () => {
    const amount = Number(amountStr);
    if (!desc || isNaN(amount) || amount <= 0 || !selectedPayer) {
      return alert("VUI LÒNG NHẬP ĐẦY ĐỦ THÔNG TIN VÀ NGƯỜI CHI!");
    }
    
    const newExp = { id: Date.now(), desc, amount, payer: selectedPayer };
    const updated = [...expenses, newExp];
    setExpenses(updated);
    localStorage.setItem("cyber_expenses", JSON.stringify(updated));
    setDesc("");
    setAmountStr("");
  };

  const handleClear = () => {
    if (confirm("⚠️ DANGER: Xóa sạch toàn bộ lịch sử thu chi?")) {
      setExpenses([]);
      localStorage.removeItem("cyber_expenses");
    }
  };

  // --- THUẬT TOÁN BÙ TRỪ TÀI CHÍNH ---
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const playersCount = Math.max(1, players.length);
  const perPerson = Math.ceil(totalSpent / playersCount);

  // Tính toán số dư cho từng người
  const balances: Record<string, number> = {};
  
  // Gán mức nợ mặc định cho tất cả mọi người (-perPerson)
  players.forEach(p => {
    balances[p] = -perPerson;
  });

  // Cộng lại số tiền họ đã ứng trước
  expenses.forEach(e => {
    // Nếu người chi là khách ngoài (không có trong list), thêm họ vào map
    if (balances[e.payer] === undefined) balances[e.payer] = 0;
    balances[e.payer] += e.amount;
  });

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans uppercase pb-10">
      {/* HEADER */}
      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 border-b border-[#fcee0a] pb-4">
        <h1 className="text-xl font-black text-[#fcee0a] tracking-widest">HỆ THỐNG TÀI CHÍNH</h1>
        <button onClick={() => router.push('/')} className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</button>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        
        {/* TỔNG QUAN TÀI CHÍNH */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#ff003c]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1 break-words w-full">TỔNG CHI PHÍ</div>
            <div className="text-[#ff003c] text-xl font-black break-words w-full">{totalSpent.toLocaleString()} đ</div>
          </div>
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#00f3ff]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1 break-words w-full">TRUNG BÌNH ({playersCount} NGƯỜI)</div>
            <div className="text-[#00f3ff] text-xl font-black break-words w-full">{perPerson.toLocaleString()} đ</div>
          </div>
        </div>

        {/* BẢNG QUYẾT TOÁN BÙ TRỪ */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4">BẢNG BÙ TRỪ QUYẾT TOÁN</h2>
          <div className="flex flex-col gap-2">
            {Object.keys(balances).length === 0 ? (
              <div className="text-gray-600 text-sm font-bold text-center">CHƯA CÓ NGƯỜI CHƠI NÀO</div>
            ) : (
              Object.entries(balances)
                .sort((a, b) => a[1] - b[1]) // Sắp xếp: Ai nợ nhiều xếp trên, ai nhận lại xếp dưới
                .map(([playerName, balance]) => (
                <div key={playerName} className="flex justify-between items-center bg-black p-3 border border-gray-800 rounded">
                  <span className="text-gray-300 font-bold text-sm">{playerName}</span>
                  {balance === 0 ? (
                    <span className="text-gray-500 font-black text-sm">HÒA TIỀN</span>
                  ) : balance > 0 ? (
                    <span className="text-[#00f3ff] font-black text-sm">NHẬN LẠI: +{balance.toLocaleString()} đ</span>
                  ) : (
                    <span className="text-[#ff003c] font-black text-sm">CẦN ĐÓNG: {Math.abs(balance).toLocaleString()} đ</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* FORM NHẬP KHOẢN CHI */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-gray-700">
          <h2 className="text-[#fcee0a] font-black tracking-widest mb-4">GHI NHẬN KHOẢN CHI</h2>
          <div className="flex flex-col gap-3">
            <input 
              value={desc} onChange={(e) => setDesc(e.target.value)} 
              placeholder="VD: MUA 2 ỐNG CẦU, TRẢ TIỀN SÂN..." 
              className="bg-black border border-gray-700 text-white px-4 py-3 rounded focus:border-[#fcee0a] focus:outline-none placeholder-gray-600 font-bold text-sm" 
            />
            <div className="flex gap-2">
              <input 
                type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} 
                placeholder="SỐ TIỀN (VD: 350000)" 
                className="flex-1 bg-black border border-gray-700 text-white px-4 py-3 rounded focus:border-[#fcee0a] focus:outline-none font-bold" 
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 font-bold text-xs shrink-0">NGƯỜI TRẢ TIỀN:</span>
              <select 
                value={selectedPayer} onChange={(e) => setSelectedPayer(e.target.value)}
                className="flex-1 bg-black border border-gray-700 text-[#00f3ff] px-3 py-3 rounded focus:border-[#00f3ff] focus:outline-none font-black text-sm"
              >
                {players.length === 0 && <option value="">--- CHƯA CÓ AI ---</option>}
                {players.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button onClick={handleAdd} className="bg-[#fcee0a] text-black px-6 py-3 font-black rounded active:scale-95 touch-manipulation">LƯU</button>
            </div>
          </div>
        </div>

        {/* LỊCH SỬ KHOẢN CHI CỤ THỂ */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-black tracking-widest">LỊCH SỬ CHI TIÊU</h2>
            {expenses.length > 0 && (
              <button onClick={handleClear} className="text-[#ff003c] font-bold text-xs border border-[#ff003c] px-3 py-1 rounded touch-manipulation">XOÁ SẠCH</button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {expenses.length === 0 ? (
              <div className="text-gray-600 text-center py-4 font-bold">CHƯA CÓ KHOẢN CHI NÀO</div>
            ) : expenses.map(e => (
              <div key={e.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black p-3 border border-gray-800 rounded gap-1">
                <div className="flex flex-col">
                  <span className="text-gray-300 font-bold text-sm truncate">{e.desc}</span>
                  <span className="text-gray-500 text-xs mt-1">Người chi: <span className="text-[#00f3ff]">{e.payer || "Ai đó"}</span></span>
                </div>
                <span className="text-[#fcee0a] font-black shrink-0 sm:text-right mt-1 sm:mt-0">{e.amount.toLocaleString()} đ</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}