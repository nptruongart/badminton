"use client";
import { useState, useEffect } from "react";

interface Expense { id: number; desc: string; amount: number; payer: string; }
interface Transaction { from: string; to: string; amount: number; }

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [amountStr, setAmountStr] = useState(""); 
  const [selectedPayer, setSelectedPayer] = useState("");
  
  // State lưu thông tin ngân hàng của các tay vợt
  const [bankInfo, setBankInfo] = useState<Record<string, { bankId: string, accountNo: string }>>({});
  const [qrModal, setQrModal] = useState<{ isOpen: boolean, url: string, payerName: string, amount: number } | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedExp = JSON.parse(localStorage.getItem("cyber_expenses") || "[]");
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]").map((p: any) => p.name);
    const savedBanks = JSON.parse(localStorage.getItem("cyber_banks") || "{}");
    
    setExpenses(savedExp); setPlayers(savedPlayers); setBankInfo(savedBanks);
    if (savedPlayers.length > 0) setSelectedPayer(savedPlayers[0]);
    setIsLoaded(true);
  }, []);

  const handleAdd = () => {
    const amount = Number(amountStr);
    if (!desc || isNaN(amount) || amount <= 0 || !selectedPayer) return alert("VUI LÒNG NHẬP ĐẦY ĐỦ!");
    const newExp = { id: Date.now(), desc, amount, payer: selectedPayer };
    const updated = [...expenses, newExp];
    setExpenses(updated); localStorage.setItem("cyber_expenses", JSON.stringify(updated));
    setDesc(""); setAmountStr("");
  };

  const handleClear = () => {
    if (confirm("⚠️ Xóa sạch lịch sử thu chi?")) {
      setExpenses([]); localStorage.removeItem("cyber_expenses");
    }
  };

  // Setup Bank Info Nhanh
  const setupBankInfo = (playerName: string) => {
    const bankId = prompt(`Nhập TÊN NGÂN HÀNG của ${playerName} (VD: VCB, MB, TCB, Momo, ACB...):`, bankInfo[playerName]?.bankId || "");
    if (!bankId) return;
    const accountNo = prompt(`Nhập SỐ TÀI KHOẢN của ${playerName}:`, bankInfo[playerName]?.accountNo || "");
    if (!accountNo) return;

    const newBankInfo = { ...bankInfo, [playerName]: { bankId: bankId.trim().toUpperCase(), accountNo: accountNo.trim() } };
    setBankInfo(newBankInfo);
    localStorage.setItem("cyber_banks", JSON.stringify(newBankInfo));
    alert(`✅ Đã lưu STK cho ${playerName}!`);
  };

  // Mở mã VietQR
  const openQR = (payerName: string, amount: number) => {
    const info = bankInfo[payerName];
    if (!info) {
      alert(`⚠️ ${payerName} chưa cài đặt Số Tài Khoản. Vui lòng cài đặt trước!`);
      setupBankInfo(payerName);
      return;
    }
    // Generate VietQR Link
    const qrUrl = `https://img.vietqr.io/image/${info.bankId}-${info.accountNo}-compact2.jpg?amount=${amount}&addInfo=Thanh toan tien cau long&accountName=${payerName}`;
    setQrModal({ isOpen: true, url: qrUrl, payerName, amount });
  };

  // --- THUẬT TOÁN BÙ TRỪ & LÀM TRÒN ---
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const playersCount = Math.max(1, players.length);
  const perPerson = Math.ceil((totalSpent / playersCount) / 1000) * 1000;
  const excess = (perPerson * playersCount) - totalSpent;
  
  const balances: Record<string, number> = {};
  players.forEach(p => { balances[p] = -perPerson; });
  expenses.forEach(e => {
    if (balances[e.payer] === undefined) balances[e.payer] = 0;
    balances[e.payer] += e.amount;
  });

  if (excess > 0 && Object.keys(balances).length > 0) {
    let topCreditor = Object.keys(balances)[0];
    for (const p of Object.keys(balances)) { if (balances[p] > balances[topCreditor]) topCreditor = p; }
    balances[topCreditor] += excess;
  }

  const transactions: Transaction[] = [];
  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];

  for (const [name, balance] of Object.entries(balances)) {
    if (balance < -0.5) debtors.push({ name, amount: Math.abs(balance) });
    else if (balance > 0.5) creditors.push({ name, amount: balance });
  }
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0; let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]; const creditor = creditors[j];
    const transferAmount = Math.min(debtor.amount, creditor.amount);
    if (transferAmount > 0) transactions.push({ from: debtor.name, to: creditor.name, amount: Math.round(transferAmount) });
    debtor.amount -= transferAmount; creditor.amount -= transferAmount;
    if (debtor.amount < 0.5) i++; if (creditor.amount < 0.5) j++;
  }

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white p-4 font-sans uppercase pb-20 overflow-y-auto">
      
      {/* MODAL HIỂN THỊ MÃ QR */}
      {qrModal && qrModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border-2 border-[#39ff14] p-4 rounded-xl max-w-sm w-full flex flex-col items-center shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <h2 className="text-[#39ff14] font-black text-xl mb-2 text-center">QUÉT MÃ THANH TOÁN</h2>
            <p className="text-gray-300 text-sm mb-4 text-center font-bold">Chuyển cho <span className="text-[#00f3ff]">{qrModal.payerName}</span> - Số tiền: <span className="text-[#fcee0a]">{qrModal.amount.toLocaleString()} đ</span></p>
            
            <div className="bg-white p-2 rounded-lg mb-6">
              <img src={qrModal.url} alt="VietQR" className="w-full h-auto object-contain rounded" />
            </div>
            
            <button onClick={() => setQrModal(null)} className="w-full bg-[#ff003c] text-white font-black py-3 rounded-lg tracking-widest active:scale-95 touch-manipulation">ĐÓNG QR KHUNG</button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 border-b border-[#fcee0a] pb-4">
        <h1 className="text-xl font-black text-[#fcee0a] tracking-widest">TÀI CHÍNH (VIETQR)</h1>
        <a href="/" className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</a>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#ff003c]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1">TỔNG CHI PHÍ</div>
            <div className="text-[#ff003c] text-xl font-black">{totalSpent.toLocaleString()} đ</div>
          </div>
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#00f3ff]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">TRUNG BÌNH ({playersCount} NGƯỜI)</div>
            <div className="text-[#00f3ff] text-xl font-black">{perPerson.toLocaleString()} đ</div>
          </div>
        </div>

        {/* PHƯƠNG ÁN CHUYỂN TIỀN CÓ NÚT MỞ MÃ QR */}
        {transactions.length > 0 && (
          <div className="bg-[#0d0d0d] p-5 rounded border border-[#b537f2]/30 shadow-[0_0_15px_rgba(181,55,242,0.15)]">
            <h2 className="text-[#b537f2] font-black tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#b537f2] rounded-full animate-pulse"></span>
              PHƯƠNG ÁN CHUYỂN TIỀN
            </h2>
            <div className="flex flex-col gap-3">
              {transactions.map((t, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black p-3 border border-gray-800 rounded gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[#ff003c] font-bold text-sm truncate">{t.from}</span>
                    <span className="text-gray-500 text-xs shrink-0">👉 chuyển 👉</span>
                    <span className="text-[#00f3ff] font-bold text-sm truncate">{t.to}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#fcee0a] font-black">{t.amount.toLocaleString()} đ</span>
                    {/* 🚀 NÚT KÍCH HOẠT VIETQR 🚀 */}
                    <button onClick={() => openQR(t.to, t.amount)} className="bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] px-3 py-1 rounded text-xs font-black shrink-0 touch-manipulation hover:bg-[#39ff14] hover:text-black transition-colors">
                      MỞ QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DANH SÁCH NGƯỜI NHẬN & CÀI ĐẶT BANK */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4">CÀI ĐẶT NGÂN HÀNG NHẬN TIỀN</h2>
          <div className="space-y-2">
            {players.filter(p => balances[p] > 0).map(p => (
              <div key={p} className="flex justify-between items-center bg-black p-3 border border-gray-800 rounded">
                <span className="text-gray-300 font-bold text-sm">{p}</span>
                {bankInfo[p] ? (
                  <button onClick={() => setupBankInfo(p)} className="text-[#00f3ff] text-xs font-bold px-2 py-1 border border-[#00f3ff]/50 rounded touch-manipulation">
                    {bankInfo[p].bankId} ({bankInfo[p].accountNo.slice(-4)}) ✏️
                  </button>
                ) : (
                  <button onClick={() => setupBankInfo(p)} className="text-[#ff003c] text-xs font-bold px-2 py-1 border border-[#ff003c] rounded touch-manipulation">
                    + CÀI ĐẶT STK
                  </button>
                )}
              </div>
            ))}
            {players.filter(p => balances[p] > 0).length === 0 && <p className="text-gray-500 text-xs font-bold">CHƯA CÓ AI CẦN NHẬN TIỀN</p>}
          </div>
        </div>

        {/* FORM NHẬP KHOẢN CHI (Rút gọn) */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-gray-700">
          <h2 className="text-[#fcee0a] font-black tracking-widest mb-4">GHI NHẬN KHOẢN CHI</h2>
          <div className="flex flex-col gap-3">
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="VD: TIỀN SÂN..." className="bg-black border border-gray-700 text-white px-4 py-3 rounded" />
            <div className="flex gap-2">
              <input type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder="SỐ TIỀN" className="flex-1 bg-black border border-gray-700 text-white px-4 py-3 rounded" />
              <select value={selectedPayer} onChange={(e) => setSelectedPayer(e.target.value)} className="bg-black border border-gray-700 text-[#00f3ff] px-3 rounded font-black">
                {players.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={handleAdd} className="bg-[#fcee0a] text-black px-4 font-black rounded touch-manipulation">LƯU</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}