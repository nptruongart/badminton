"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Expense {
  id: number;
  name: string;
  payer: string;
  amount: number;
}

export default function FinancePage() {
  const [members, setMembers] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [newExpName, setNewExpName] = useState("");
  const [newExpPayer, setNewExpPayer] = useState("");
  const [newExpAmount, setNewExpAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  // 📥 ĐỒNG BỘ DỮ LIỆU TỪ DATABASE (Thành viên chung + Khoản chi)
  useEffect(() => {
    Promise.all([
      fetch('/api/players').then(res => res.json()),
      fetch('/api/expenses').then(res => res.json())
    ])
      .then(([playerData, expenseData]) => {
        if (playerData.success && playerData.players.length > 0) {
          const names = playerData.players.map((p: any) => p.name);
          setMembers(names);
          if (names.length > 0) setNewExpPayer(names[0]);
        }

        if (expenseData.success) {
          setExpenses(expenseData.expenses);
          // Nếu chưa có khoản chi tiền cầu nào, tự động cộng thêm từ cấu hình setting giá cầu
          if (expenseData.expenses.length === 0) {
            const price = localStorage.getItem("setting_shuttlePrice");
            if (price) {
              const defaultShuttleAmount = Number(price) * 3;
              // Tự động tạo khoản chi tiền cầu mặc định vào DB
              fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "add", name: "Tiền cầu", payer: playerData.players[0]?.name || "Lien", amount: defaultShuttleAmount })
              }).then(() => {
                fetch('/api/expenses').then(r => r.json()).then(d => { if (d.success) setExpenses(d.expenses); });
              });
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi đồng bộ finance:", err);
        setLoading(false);
      });
  }, []);

  const handleAddExpense = async () => {
    if (!newExpName || !newExpPayer || !newExpAmount) return alert("Vui lòng nhập đủ thông tin khoản chi!");

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "add", name: newExpName, payer: newExpPayer, amount: newExpAmount })
      });
      const data = await res.json();
      if (data.success) {
        setExpenses([data.expense, ...expenses]);
        setNewExpName("");
        setNewExpAmount("");
      }
    } catch (error) {
      alert("Lỗi thêm khoản chi!");
    }
  };

  const handleRemoveExpense = async (id: number) => {
    if (!confirm("Xóa khoản chi này?")) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "delete", id })
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    } catch (error) {
      alert("Lỗi xóa khoản chi!");
    }
  };

  const paidPerMember = members.reduce((acc, member) => {
    acc[member] = expenses.filter(e => e.payer === member).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const needToPayPerMember = members.length > 0 ? Math.round(totalExpense / members.length) : 0;

  const balances = members.reduce((acc, member) => {
    acc[member] = (paidPerMember[member] || 0) - needToPayPerMember;
    return acc;
  }, {} as Record<string, number>);

  const calculateTransfers = () => {
    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    for (const [name, balance] of Object.entries(balances)) {
      if (balance < -10) debtors.push({ name, amount: Math.abs(balance) });
      else if (balance > 10) creditors.push({ name, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers: { from: string; to: string; amount: number }[] = [];
    let d = 0, c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      
      const amount = Math.min(debtor.amount, creditor.amount);
      const roundedAmount = Math.round(amount / 1000) * 1000; 

      if (roundedAmount > 0) transfers.push({ from: debtor.name, to: creditor.name, amount: roundedAmount });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 10) d++;
      if (creditor.amount < 10) c++;
    }
    return transfers;
  };

  const transfers = calculateTransfers();

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#111', color: 'white', minHeight: '100vh' }}>Đang liên kết Database...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5', color: '#333', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>💰 Quản Lý Thu Chi CLB (Link Database)</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/settings" style={{ padding: '10px 15px', backgroundColor: '#ff4757', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            ⚙ Cài Đặt Giá Cầu
          </Link>
          <Link href="/" style={{ padding: '10px 15px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            ⬅ Về Trang Chủ
          </Link>
        </div>
      </div>

      {/* THÊM KHOẢN CHI */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#ff4757' }}>🧾 Thêm khoản chi mới</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input value={newExpName} onChange={(e) => setNewExpName(e.target.value)} placeholder="Tên khoản (VD: Tiền nước)" style={{ flex: 2, minWidth: '200px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          
          <select value={newExpPayer} onChange={(e) => setNewExpPayer(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <option value="" disabled>Ai trả?</option>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <input type="number" value={newExpAmount} onChange={(e) => setNewExpAmount(Number(e.target.value))} placeholder="Số tiền (VNĐ)" style={{ flex: 1.5, minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          
          <button onClick={handleAddExpense} style={{ padding: '10px 20px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Ghi</button>
        </div>
      </div>

      {/* BẢNG KHOẢN CHI */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#fff200' }}>
              <th style={{ padding: '10px', border: '1px solid #ccc', width: '50px' }}>Xóa</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Khoản chi</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Người chi</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Số tiền</th>
              {members.map(m => <th key={m} style={{ padding: '10px', border: '1px solid #ccc', backgroundColor: '#a9dfbf' }}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? <tr><td colSpan={members.length + 4} style={{ padding: '20px' }}>Chưa có khoản chi nào!</td></tr> : null}
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td style={{ border: '1px solid #ccc' }}><button onClick={() => handleRemoveExpense(expense.id)} style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>X</button></td>
                <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>{expense.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{expense.payer}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{expense.amount.toLocaleString('vi-VN')} đ</td>
                {members.map(m => (
                  <td key={m} style={{ padding: '10px', border: '1px solid #ccc', color: '#666' }}>
                    {members.length > 0 ? Math.round(expense.amount / members.length).toLocaleString('vi-VN') : 0} đ
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BẢNG TỔNG KẾT & CHUYỂN KHOẢN */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '450px', overflowX: 'auto', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '1rem' }}>
            <tbody>
              <tr style={{ backgroundColor: '#e8f8f5' }}>
                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'left' }}>Đã chi</td>
                {members.map(m => <td key={m} style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{(paidPerMember[m] || 0).toLocaleString('vi-VN')} đ</td>)}
              </tr>
              <tr style={{ backgroundColor: '#e8f8f5' }}>
                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'left' }}>Cần đóng</td>
                {members.map(m => <td key={m} style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', color: '#ff4757' }}>{needToPayPerMember.toLocaleString('vi-VN')} đ</td>)}
              </tr>
              <tr style={{ backgroundColor: '#e8f8f5' }}>
                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'left' }}>Chênh lệch</td>
                {members.map(m => (
                  <td key={m} style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', color: (balances[m] || 0) < 0 ? 'red' : 'green' }}>
                    {(balances[m] || 0).toLocaleString('vi-VN')} đ
                  </td>
                ))}
              </tr>
              <tr style={{ backgroundColor: '#e8f8f5' }}>
                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'left' }}>Chốt</td>
                {members.map(m => (
                  <td key={m} style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', color: (balances[m] || 0) > 10 ? 'green' : (balances[m] || 0) < -10 ? 'red' : '#333' }}>
                    {(balances[m] || 0) > 10 ? 'Nhận lại' : (balances[m] || 0) < -10 ? 'Cần trả' : 'Đủ'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, minWidth: '350px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#ff9f43' }}>💳 Cần Chuyển Khoản</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#a9dfbf' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Ai trả?</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Số tiền</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Gửi cho ai?</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? <tr><td colSpan={3} style={{ padding: '10px', textAlign: 'center' }}>Không ai nợ ai! 🎉</td></tr> : null}
              {transfers.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{t.from}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', color: '#ff4757' }}>{t.amount.toLocaleString('vi-VN')} đ</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold', color: '#2ed573' }}>{t.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}