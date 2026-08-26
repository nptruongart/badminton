"use client";
import { useState, useEffect } from "react";

interface Expense { id: number; desc: string; amount: number; payer: string; }
interface Transaction { from: string; to: string; amount: number; }
interface PlayerData { name: string; [key: string]: unknown; }

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
    // Ép kiểu chuẩn xác để Vercel không báo lỗi Build
    const savedPlayers = JSON.parse(localStorage.getItem("cyber_players") || "[]").map((p: PlayerData) => p.name);
    const savedBanks = JSON.parse(localStorage.getItem("cyber_banks") || "{}");
    
    setExpenses(savedExp); 
    setPlayers(savedPlayers); 
    setBankInfo(savedBanks);
    if (savedPlayers.length > 0) setSelectedPayer(savedPlayers[0]);
    setIsLoaded(true);
  }, []);

  // 🎵 HÀM PHÁT ÂM THANH SFX
  const playSound = (type: 'click' | 'success' | 'delete') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'click') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'delete') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  };

  const handleAdd = () => {
    const amount = Number(amountStr);
    if (!desc || isNaN(amount) || amount <= 0 || !selectedPayer) return alert("VUI LÒNG NHẬP ĐẦY ĐỦ!");
    playSound('success');
    const newExp = { id: Date.now(), desc, amount, payer: selectedPayer };
    const updated = [...expenses, newExp];
    setExpenses(updated); localStorage.setItem("cyber_expenses", JSON.stringify(updated));
    setDesc(""); setAmountStr("");
  };

  const handleClear = () => {
    if (confirm("⚠️ Xóa sạch lịch sử thu chi?")) {
      playSound('delete');
      setExpenses([]); localStorage.removeItem("cyber_expenses");
    }
  };

  // 🏦 Setup Bank Info Nhanh
  const setupBankInfo = (playerName: string) => {
    const bankId = prompt(`Nhập TÊN NGÂN HÀNG của ${playerName}\n(VD: VCB, MB, TCB, Momo, ACB...):`, bankInfo[playerName]?.bankId || "");
    if (!bankId) return;
    const accountNo = prompt(`Nhập SỐ TÀI KHOẢN của ${playerName}:`, bankInfo[playerName]?.accountNo || "");
    if (!accountNo) return;

    const newBankInfo = { ...bankInfo, [playerName]: { bankId: bankId.trim().toUpperCase(), accountNo: accountNo.trim() } };
    setBankInfo(newBankInfo);
    localStorage.setItem("cyber_banks", JSON.stringify(newBankInfo));
    playSound('success');
    alert(`✅ Đã lưu STK cho ${playerName}!`);
  };

  // 📱 Mở mã VietQR
  const openQR = (payerName: string, amount: number) => {
    const info = bankInfo[payerName];
    if (!info) {
      alert(`⚠️ ${payerName} chưa cài đặt Số Tài Khoản. Vui lòng cài đặt trước!`);
      setupBankInfo(payerName);
      return;
    }
    playSound('click');
    const qrUrl = `https://img.vietqr.io/image/${info.bankId}-${info.accountNo}-compact2.jpg?amount=${amount}&addInfo=Thanh%20toan%20tien%20cau%20long&accountName=${encodeURIComponent(payerName)}`;
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

  // 📋 HÀM COPY BÁO CÁO ZALO
  const copyZaloReport = () => {
    let report = `🏸 *QUYẾT TOÁN TIỀN CẦU SÂN* 🏸\n`;
    report += `------------------------------------\n`;
    report += `💰 Tổng chi phí: ${totalSpent.toLocaleString()} đ\n`;
    report += `👥 Số người tham gia: ${playersCount}\n`;
    report += `📊 Mỗi người đóng: ${perPerson.toLocaleString()} đ (Đã làm tròn)\n\n`;
    
    report += `📝 *CHI TIẾT KHOẢN CHI:*\n`;
    expenses.forEach(e => {
      report += `- ${e.desc}: ${e.amount.toLocaleString()} đ (${e.payer} ứng)\n`;
    });

    report += `\n💸 *PHƯƠNG ÁN CHUYỂN KHOẢN:*\n`;
    if (transactions.length === 0) {
      report += `(Tất cả đã hòa tiền!)\n`;
    } else {
      transactions.forEach(t => {
        report += `👉 ${t.from} chuyển cho ${t.to}: *${t.amount.toLocaleString()} đ*\n`;
      });
      if (excess > 0) {
        report += `\n*(Tiền dư làm tròn ${excess.toLocaleString()}đ đã được cộng cho người ứng quỹ nhiều nhất)*\n`;
      }
    }
    report += `------------------------------------\n`;
    report += `⚡ Powered by Cyber Badminton`;

    navigator.clipboard.writeText(report).then(() => {
      playSound('success');
      alert("✅ ĐÃ COPY BÁO CÁO VÀO BỘ NHỚ TẠM!\n\nBạn có thể dán (Paste) trực tiếp vào group Zalo.");
    }).catch(() => alert("❌ Lỗi khi copy, trình duyệt không hỗ trợ!"));
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#050505]"></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white p-4 font-sans uppercase pb-20 overflow-y-auto">
      
      {/* 📱 MODAL HIỂN THỊ MÃ QR */}
      {qrModal && qrModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border-2 border-[#39ff14] p-4 rounded-xl max-w-sm w-full flex flex-col items-center shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <h2 className="text-[#39ff14] font-black text-xl mb-2 text-center tracking-widest">QUÉT MÃ THANH TOÁN</h2>
            <p className="text-gray-300 text-sm mb-4 text-center font-bold">
              Chuyển cho <span className="text-[#00f3ff]">{qrModal.payerName}</span><br/>
              Số tiền: <span className="text-[#fcee0a] text-lg">{qrModal.amount.toLocaleString()} đ</span>
            </p>
            <div className="bg-white p-2 rounded-lg mb-6 w-full flex justify-center">
              {/* Lệnh bùa chú vượt tường lửa Vercel */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.url} alt="VietQR" className="w-64 h-64 object-contain rounded" />
            </div>
            <button 
              onClick={() => { playSound('click'); setQrModal(null); }} 
              className="w-full bg-[#ff003c] text-white font-black py-3 rounded-lg tracking-widest active:scale-95 touch-manipulation"
            >
              ĐÓNG QR KHUNG
            </button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 border-b border-[#fcee0a] pb-4">
        <h1 className="text-xl font-black text-[#fcee0a] tracking-widest">HỆ THỐNG TÀI CHÍNH</h1>
        <a href="/" onClick={() => playSound('click')} className="bg-[#0d0d0d] border border-gray-500 text-gray-400 px-4 py-2 rounded font-bold text-sm touch-manipulation">QUAY LẠI</a>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* TỔNG QUAN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#ff003c]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-xs font-bold tracking-widest mb-1">TỔNG CHI PHÍ</div>
            <div className="text-[#ff003c] text-xl font-black">{totalSpent.toLocaleString()} đ</div>
          </div>
          <div className="bg-[#0d0d0d] p-4 rounded border border-[#00f3ff]/50 flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">TRUNG BÌNH ({playersCount} NGƯỜI)</div>
            <div className="text-[#00f3ff] text-xl font-black">{perPerson.toLocaleString()} đ</div>
            <div className="text-gray-500 text-[9px] mt-1">(Đã làm tròn chẵn)</div>
          </div>
        </div>

        {/* NÚT COPY BÁO CÁO ZALO */}
        {expenses.length > 0 && (
          <button onClick={copyZaloReport} className="w-full bg-[#0d0d0d] border-2 border-[#00f3ff] text-[#00f3ff] active:opacity-50 font-black py-4 rounded flex justify-center items-center gap-2 text-base transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-widest touch-manipulation cursor-pointer">
            📤 COPY BÁO CÁO GỬI ZALO
          </button>
        )}

        {/* PHƯƠNG ÁN CHUYỂN TIỀN (CÓ NÚT MỞ QR XANH LÈ) */}
        {transactions.length > 0 && (
          <div className="bg-[#0d0d0d] p-5 rounded border border-[#b537f2]/30 shadow-[0_0_15px_rgba(181,55,242,0.15)]">
            <h2 className="text-[#b537f2] font-black tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#b537f2] rounded-full animate-pulse"></span>
              PHƯƠNG ÁN CHUYỂN TIỀN
            </h2>
            <div className="flex flex-col gap-3">
              {transactions.map((t, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row justify-between items-center bg-black p-3 border border-gray-800 rounded gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                    <span className="text-[#ff003c] font-bold text-sm truncate">{t.from}</span>
                    <span className="text-gray-500 text-xs shrink-0">👉 chuyển 👉</span>
                    <span className="text-[#00f3ff] font-bold text-sm truncate">{t.to}</span>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <span className="text-[#fcee0a] font-black">{t.amount.toLocaleString()} đ</span>
                    {/* 🚀 NÚT KÍCH HOẠT VIETQR TÔ MÀU XANH NỔI BẬT 🚀 */}
                    <button onClick={() => openQR(t.to, t.amount)} className="bg-[#39ff14] text-black px-4 py-2 rounded text-xs font-black shrink-0 touch-manipulation hover:scale-105 transition-transform shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                      MỞ QR 📱
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {excess > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-800 text-gray-500 text-[10px] italic text-center">
                *Tiền lẻ làm tròn dư ({excess.toLocaleString()}đ) được cộng cho người ứng quỹ nhiều nhất.
              </div>
            )}
          </div>
        )}

        {/* CÀI ĐẶT NGÂN HÀNG (Dành cho người nhận) */}
        {players.filter(p => balances[p] > 0).length > 0 && (
          <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]">
            <h2 className="text-[#39ff14] font-black tracking-widest mb-4">CÀI ĐẶT BANK NGƯỜI NHẬN</h2>
            <div className="space-y-2">
              {players.filter(p => balances[p] > 0).map(p => (
                <div key={p} className="flex justify-between items-center bg-black p-3 border border-gray-800 rounded">
                  <span className="text-gray-300 font-bold text-sm">{p}</span>
                  {bankInfo[p] ? (
                    <button onClick={() => setupBankInfo(p)} className="text-[#00f3ff] text-xs font-bold px-3 py-1.5 border border-[#00f3ff]/50 rounded touch-manipulation">
                      {bankInfo[p].bankId} ({bankInfo[p].accountNo.slice(-4)}) ✏️
                    </button>
                  ) : (
                    <button onClick={() => setupBankInfo(p)} className="text-[#ff003c] text-xs font-bold px-3 py-1.5 border border-[#ff003c] rounded touch-manipulation animate-pulse">
                      + CÀI ĐẶT STK
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SỐ DƯ TỔNG QUÁT */}
        <div className="bg-[#0d0d0d] p-5 rounded border border-[#39ff14]/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]">
          <h2 className="text-[#39ff14] font-black tracking-widest mb-4">SỐ DƯ TỔNG QUÁT</h2>
          <div className="flex flex-col gap-2">
            {Object.keys(balances).length === 0 ? (
              <div className="text-gray-600 text-sm font-bold text-center">CHƯA CÓ NGƯỜI CHƠI NÀO</div>
            ) : (
              Object.entries(balances)
                .sort((a, b) => a[1] - b[1]) 
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
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="VD: TIỀN SÂN..." className="bg-black border border-gray-700 text-white px-4 py-3 rounded" />
            <div className="flex gap-2">
              <input type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder="SỐ TIỀN" className="flex-1 bg-black border border-gray-700 text-white px-4 py-3 rounded" />
              <select value={selectedPayer} onChange={(e) => setSelectedPayer(e.target.value)} className="bg-black border border-gray-700 text-[#00f3ff] px-2 rounded font-black max-w-[100px]">
                {players.length === 0 && <option value="">AI TRẢ?</option>}
                {players.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={handleAdd} className="bg-[#fcee0a] text-black px-4 font-black rounded touch-manipulation">LƯU</button>
            </div>
          </div>
        </div>

        {/* LỊCH SỬ KHOẢN CHI */}
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
                  <span className="text-gray-500 text-xs mt-1">Người chi: <span className="text-[#00f3ff]">{e.payer}</span></span>
                </div>
                <span className="text-[#fcee0a] font-black shrink-0 sm:text-right">{e.amount.toLocaleString()} đ</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}