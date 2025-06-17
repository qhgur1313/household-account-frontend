import React, { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";

function RecordTable({ data, startDate, endDate, loading, refetchRecords }) {
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

  const [editCell, setEditCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const [records, setRecords] = useState(data);

  useEffect(() => {
    setRecords(data);
  }, [data]);

  useEffect(() => {
    if (showModal) {
      fetch(`${process.env.REACT_APP_API_URL}/categories`).then(r => r.json()).then(setCategories);
      fetch(`${process.env.REACT_APP_API_URL}/methods`).then(r => r.json()).then(setMethods);
      // 기본값 세팅
      setForm(f => ({
        ...f,
        date: new Date().toISOString().slice(0, 10),
        category_id: "",
        method_id: "",
        amount: "",
        user_name: "",
        etc: ""
      }));
      setError("");
    }
  }, [showModal]);

  useEffect(() => {
    if (editCell.id !== null) {
      fetch(`${process.env.REACT_APP_API_URL}/categories`).then(r => r.json()).then(setCategories);
      fetch(`${process.env.REACT_APP_API_URL}/methods`).then(r => r.json()).then(setMethods);
    }
  }, [editCell.id]);

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
      const newRecord = await res.json(); // 새로 추가된 레코드를 받습니다.
      setRecords(prevRecords => [...prevRecords, newRecord]); // records 상태 업데이트
      setShowModal(false);
      if (refetchRecords) refetchRecords(); // 부모 컴포넌트에 데이터 변경 알림 (필요한 경우)
    } catch (e) {
      setError("저장 중 오류 발생");
    }
    setSaving(false);
  };

  const handleEditDoubleClick = (id, field, currentValue) => {
    setEditCell({ id, field });
    setEditValue(currentValue);
    setEditError("");
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleEditSubmit = async (recordId, field) => {
    const originalRecord = records.find(r => r.id === recordId); // data 대신 records 사용
    if (!originalRecord) return;

    let submitValue = editValue.trim();

    if (originalRecord[field] === submitValue && field !== 'etc') {
        if (field === 'etc' && (originalRecord.etc === null || originalRecord.etc === '') && submitValue === '') {
            setEditCell({ id: null, field: null });
            return;
        }
    }

    if (!submitValue && field !== 'etc') {
      setEditError("값을 입력하세요");
      return;
    }

    let actualValue = submitValue;
    if (field === 'category') {
      const selectedCategory = categories.find(c => c.type === submitValue);
      if (!selectedCategory) {
        setEditError("유효한 카테고리를 선택하세요");
        return;
      }
      actualValue = selectedCategory.id;
      field = 'category_id';
    } else if (field === 'method') {
      const selectedMethod = methods.find(m => m.type === submitValue);
      if (!selectedMethod) {
        setEditError("유효한 결제수단을 선택하세요");
        return;
      }
      actualValue = selectedMethod.id;
      field = 'method_id';
    } else if (field === 'amount') {
      actualValue = parseInt(submitValue, 10);
      if (isNaN(actualValue) || actualValue < 0) {
        setEditError("유효한 금액을 입력하세요");
        return;
      }
    } else if (field === 'date') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(submitValue)) {
            setEditError("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)");
            return;
        }
    }

    setEditing(true);
    setEditError("");
    try {
      const params = new URLSearchParams({
        [field]: actualValue
      });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/records/${recordId}?${params.toString()}`, {
        method: "PATCH"
      });
      if (!res.ok) throw new Error("수정 실패");
      const updatedRecord = await res.json(); // 수정된 레코드를 받습니다.
      setRecords(prevRecords => prevRecords.map(r => r.id === recordId ? updatedRecord : r)); // records 상태 업데이트
      setEditCell({ id: null, field: null });
      if (refetchRecords) refetchRecords(); // 부모 컴포넌트에 데이터 변경 알림 (필요한 경우)
    } catch (e) {
      console.error("수정 중 오류 발생: ", e);
      setEditError("수정 중 오류 발생");
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e, recordId, field) => {
    if (e.key === "Enter") handleEditSubmit(recordId, field);
    if (e.key === "Escape") { setEditCell({ id: null, field: null }); setEditValue(""); setEditError(""); }
  };

  const handleEditBlur = () => {
    if (editCell.id !== null && editCell.field !== null) {
      handleEditSubmit(editCell.id, editCell.field);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm("정말 이 지출 내역을 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/records/${recordId}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("삭제 실패");
        setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId)); // records 상태 업데이트
        if (refetchRecords) refetchRecords(); // 부모 컴포넌트에 데이터 변경 알림 (필요한 경우)
      } catch (e) {
        console.error("삭제 중 오류 발생: ", e);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  if (loading) return <div>로딩 중...</div>;

  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)); // data 대신 records 사용

  return (
    <div style={{ margin: "24px 16px", background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: "16px", position: "relative" }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        상세 지출내역
        <button onClick={() => setShowModal(true)} style={{ background: "#3498db", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>+ 추가</button>
      </h2>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>
        기간: {startDate} ~ {endDate}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: "0.9rem", whiteSpace: "nowrap" }}>날짜</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: "0.9rem", whiteSpace: "nowrap" }}>카테고리</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: "0.9rem", whiteSpace: "nowrap" }}>결제수단</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", textAlign: "right", fontSize: "0.9rem", whiteSpace: "nowrap" }}>금액</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: "0.9rem", whiteSpace: "nowrap" }}>이용자</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: "0.9rem", whiteSpace: "nowrap" }}>비고</th>
              <th style={{ padding: "8px 6px", borderBottom: "1px solid #eee", width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              // `row.id`가 undefined인 경우 `data`에서 실제 id를 찾아 사용합니다.
              const currentRecordId = row.id || data.find(r => r.etc === row.etc && r.date === row.date && r.amount === row.amount)?.id;
              return (
              <tr key={currentRecordId || `temp-${Math.random()}`} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 6px", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'date', row.date)}>
                  {editCell.id === currentRecordId && editCell.field === 'date' ? (
                    <>
                      <input
                        type="date"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'date')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      />
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    row.date
                  )}
                </td>
                <td style={{ padding: "8px 6px", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'category', row.category)}>
                  {editCell.id === currentRecordId && editCell.field === 'category' ? (
                    <>
                      <select
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'category')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      >
                        {categories.map(c => <option key={c.id} value={c.type}>{c.type}</option>)}
                      </select>
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    row.category
                  )}
                </td>
                <td style={{ padding: "8px 6px", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'method', row.method)}>
                  {editCell.id === currentRecordId && editCell.field === 'method' ? (
                    <>
                      <select
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'method')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      >
                        {methods.map(m => <option key={m.id} value={m.type}>{m.type}</option>)}
                      </select>
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    row.method
                  )}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'amount', row.amount)}>
                  {editCell.id === currentRecordId && editCell.field === 'amount' ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'amount')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box", textAlign: "right" }}
                        autoFocus
                      />
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    <span style={{ color: "#e74c3c", fontWeight: 600 }}>₩{row.amount.toLocaleString()}</span>
                  )}
                </td>
                <td style={{ padding: "8px 6px", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'user_name', row.user)}>
                  {editCell.id === currentRecordId && editCell.field === 'user_name' ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'user_name')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      />
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    row.user
                  )}
                </td>
                <td style={{ padding: "8px 6px", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onDoubleClick={() => handleEditDoubleClick(currentRecordId, 'etc', row.memo)}>
                  {editCell.id === currentRecordId && editCell.field === 'etc' ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={(e) => handleEditKeyDown(e, currentRecordId, 'etc')}
                        disabled={editing}
                        style={{ padding: 4, borderRadius: 4, border: "1px solid #3498db", width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      />
                      {editError && <div style={{ color: "#e74c3c", fontSize: 11 }}>{editError}</div>}
                    </>
                  ) : (
                    row.memo || ""
                  )}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center", width: "50px" }}>
                  <button onClick={() => handleDelete(currentRecordId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
                <input type="text" name="amount" value={form.amount} onChange={handleChange} style={{ marginLeft: 8, padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
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