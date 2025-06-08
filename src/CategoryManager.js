import React, { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [newType, setNewType] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.REACT_APP_API_URL}/categories`);
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddClick = () => {
    setShowInput(true);
    setNewType("");
    setError("");
  };

  const handleAddCategory = async () => {
    if (!newType.trim()) {
      setError("카테고리명을 입력하세요");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/categories?type=${encodeURIComponent(newType)}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("추가 실패");
      setShowInput(false);
      setNewType("");
      fetchCategories();
    } catch (e) {
      setError("추가 중 오류 발생");
    }
    setAdding(false);
  };

  const handleEdit = (id, type) => {
    setEditId(id);
    setEditValue(type);
    setEditError("");
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleEditSubmit = async () => {
    if (!editValue.trim()) {
      setEditError("카테고리명을 입력하세요");
      return;
    }
    const original = categories.find(c => c.id === editId);
    if (original && original.type === editValue.trim()) {
      setEditId(null);
      setEditValue("");
      setEditError("");
      return;
    }
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/categories/${editId}?type=${encodeURIComponent(editValue)}`, {
        method: "PATCH"
      });
      if (!res.ok) throw new Error("수정 실패");
      setEditId(null);
      setEditValue("");
      fetchCategories();
    } catch (e) {
      setEditError("수정 중 오류 발생");
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") handleEditSubmit();
    if (e.key === "Escape") { setEditId(null); setEditValue(""); setEditError(""); }
  };

  const handleEditBlur = () => {
    if (editId !== null) handleEditSubmit();
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: 32, position: "relative" }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        카테고리 목록
        <button onClick={handleAddClick} style={{ background: "#3498db", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 18, display: "flex", alignItems: "center", cursor: "pointer" }}>
          <MdAdd size={22} style={{ marginRight: 4 }} /> 추가
        </button>
      </h2>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "left" }}>카테고리명</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #eee", cursor: "pointer", position: "relative" }}
                  onDoubleClick={() => handleEdit(cat.id, cat.type)}>
                  {editId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        onKeyDown={handleEditKeyDown}
                        disabled={editing}
                        style={{ padding: 7, borderRadius: 4, border: "1px solid #3498db", width: 180 }}
                        autoFocus
                      />
                      {editError && <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 4 }}>{editError}</div>}
                    </>
                  ) : (
                    cat.type
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td style={{ textAlign: "center", color: "#aaa", padding: 20 }}>카테고리가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      )}
      {showInput && (
        <div style={{ position: "absolute", top: 32, right: 32, background: "#fff", border: "1px solid #3498db", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: 20, zIndex: 10 }}>
          <div style={{ marginBottom: 8 }}>새 카테고리명</div>
          <input
            type="text"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: 180 }}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); }}
          />
          <button onClick={handleAddCategory} disabled={adding} style={{ marginLeft: 8, padding: "7px 16px", borderRadius: 4, border: "none", background: "#3498db", color: "white", fontWeight: "bold", cursor: "pointer" }}>추가</button>
          <button onClick={() => setShowInput(false)} style={{ marginLeft: 4, padding: "7px 12px", borderRadius: 4, border: "none", background: "#eee", color: "#333", fontWeight: "bold", cursor: "pointer" }}>취소</button>
          {error && <div style={{ color: "#e74c3c", marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

export default CategoryManager; 