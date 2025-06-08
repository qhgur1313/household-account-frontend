import React, { useState, useEffect } from "react";

function RecordTable({ data, startDate, endDate, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState({
    date: "",
    category_id: "",
    method_id: "",
    amount: "",
    user_name: "",
    etc: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (showModal) {
      fetch(`${process.env.REACT_APP_API_URL}/categories`).then(r => r.json()).then(setCategories);
      fetch(`${process.env.REACT_APP_API_URL}/methods`).then(r => r.json()).then(setMethods);
      // 기본값 세팅
      setForm(f => ({
        ...f,
        date: startDate,
        category_id: "",
        method_id: "",
        amount: "",
        user_name: "",
        etc: ""
      }));
      setError("");
    }
  }, [showModal, startDate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.date || !form.category_id || !form.method_id || !form.amount || !form.user_name) {
      setError("모든 필수 항목을 입력하세요");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const params = new URLSearchParams({
        date: form.date,
        category_id: form.category_id,
        method_id: form.method_id,
        amount: form.amount,
        user_name: form.user_name,
        etc: form.etc || ""
      });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/records?${params.toString()}`, { method: "POST" });
      if (!res.ok) throw new Error("추가 실패");
      setShowModal(false);
      // 부모 fetchData를 호출할 수 없으니 window.location.reload()로 임시 대체
      window.location.reload();
    } catch (e) {
      setError("저장 중 오류 발생");
    }
    setSaving(false);
  };

  if (loading) return <div>로딩 중...</div>;

  // 날짜 내림차순 정렬 (혹시 props로 받은 data가 정렬 안되어 있을 경우)
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: 24, marginTop: 24, position: "relative" }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        상세 지출내역
        <button onClick={() => setShowModal(true)} style={{ background: "#3498db", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>+ 추가</button>
      </h2>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>
        기간: {startDate} ~ {endDate}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>날짜</th>
            <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>카테고리</th>
            <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>결제수단</th>
            <th style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "right" }}>금액</th>
            <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>이용자</th>
            <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{row.date}</td>
              <td style={{ padding: 10 }}>{row.category}</td>
              <td style={{ padding: 10 }}>{row.method}</td>
              <td style={{ padding: 10, textAlign: "right", color: "#e74c3c", fontWeight: 600 }}>₩{row.amount.toLocaleString()}</td>
              <td style={{ padding: 10 }}>{row.user}</td>
              <td style={{ padding: 10 }}>{row.memo || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div style={{ textAlign: "center", color: "#aaa", marginTop: 32 }}>지출 내역이 없습니다.</div>}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.25)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", padding: 32, minWidth: 340, position: "relative" }}>
            <h3 style={{ marginBottom: 18 }}>지출 내역 추가</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                날짜
                <input type="date" name="date" value={form.date} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
              </label>
              <label>
                카테고리
                <select name="category_id" value={form.category_id} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }}>
                  <option value="">선택</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.type}</option>)}
                </select>
              </label>
              <label>
                결제수단
                <select name="method_id" value={form.method_id} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }}>
                  <option value="">선택</option>
                  {methods.map(m => <option key={m.id} value={m.id}>{m.type}</option>)}
                </select>
              </label>
              <label>
                금액
                <input type="number" name="amount" value={form.amount} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }} min={0} />
              </label>
              <label>
                이용자
                <input type="text" name="user_name" value={form.user_name} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
              </label>
              <label>
                비고
                <input type="text" name="etc" value={form.etc} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
              </label>
            </div>
            {error && <div style={{ color: "#e74c3c", marginTop: 12 }}>{error}</div>}
            <div style={{ marginTop: 22, textAlign: "right" }}>
              <button onClick={() => setShowModal(false)} style={{ marginRight: 8, padding: "7px 16px", borderRadius: 4, border: "none", background: "#eee", color: "#333", fontWeight: "bold", cursor: "pointer" }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "7px 16px", borderRadius: 4, border: "none", background: "#3498db", color: "white", fontWeight: "bold", cursor: "pointer" }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordTable; 