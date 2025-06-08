import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { MdDashboard, MdList, MdCategory, MdPayment } from "react-icons/md";
import Dashboard from "./Dashboard";
import RecordTable from "./RecordTable";
import CategoryManager from "./CategoryManager";
import MethodManager from "./MethodManager";

function getDefaultMonthRange() {
  const now = new Date();
  const kstOffset = 9 * 60; // 분
  const localOffset = now.getTimezoneOffset();
  const diff = (kstOffset + localOffset) * 60 * 1000;
  const kstNow = new Date(now.getTime() + diff);
  const year = kstNow.getFullYear();
  const month = kstNow.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function PeriodSelector({ startDate, endDate, setStartDate, setEndDate, onSearch }) {
  return (
    <div style={{ textAlign: "center", margin: "16px 0" }}>
      <label>기간: </label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate} />
      ~
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
      <button style={{ marginLeft: 8, padding: "6px 16px", borderRadius: 4, border: "none", background: "#3498db", color: "white", fontWeight: "bold", cursor: "pointer" }} onClick={onSearch}>조회</button>
    </div>
  );
}

function AppNavigation() {
  const [value, setValue] = React.useState(0);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (value === 0) navigate("/");
    if (value === 1) navigate("/records");
    if (value === 2) navigate("/categories");
    if (value === 3) navigate("/methods");
  }, [value, navigate]);

  return (
    <BottomNavigation
      value={value}
      onChange={(e, newValue) => setValue(newValue)}
      showLabels
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)', height: '68px' }}
    >
      <BottomNavigationAction label="대시보드" icon={<MdDashboard />} sx={{ '.MuiBottomNavigationAction-label': { marginTop: '8px', marginBottom: '8px' } }}/>
      <BottomNavigationAction label="결제내역" icon={<MdList />} sx={{ '.MuiBottomNavigationAction-label': { marginTop: '8px', marginBottom: '8px' } }}/>
      <BottomNavigationAction label="카테고리" icon={<MdCategory />} sx={{ '.MuiBottomNavigationAction-label': { marginTop: '8px', marginBottom: '8px' } }}/>
      <BottomNavigationAction label="결제수단" icon={<MdPayment />} sx={{ '.MuiBottomNavigationAction-label': { marginTop: '8px', marginBottom: '8px' } }}/>
    </BottomNavigation>
  );
}

function App() {
  const defaultRange = getDefaultMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [fetchParams, setFetchParams] = useState({ start: defaultRange.start, end: defaultRange.end });
  const [recordData, setRecordData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/records?start_date=${fetchParams.start}&end_date=${fetchParams.end}`);
      const json = await res.json();
      setRecordData(json);
    } catch (e) {
      console.error("Failed to fetch records:", e);
      // 에러 처리: 사용자에게 메시지 표시 등
    } finally {
      setLoading(false);
    }
  }, [fetchParams]);

  // 기간 변경 시 데이터 fetch
  useEffect(() => {
    refetchRecords();
  }, [fetchParams, refetchRecords]);

  const handleSearch = () => {
    setFetchParams({ start: startDate, end: endDate });
  };

  return (
    <BrowserRouter>
      <div>
        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onSearch={handleSearch}
        />
        <Routes>
          <Route path="/" element={<Dashboard data={recordData} startDate={fetchParams.start} endDate={fetchParams.end} loading={loading} />} />
          <Route path="/records" element={<RecordTable data={recordData} startDate={fetchParams.start} endDate={fetchParams.end} loading={loading} refetchRecords={refetchRecords} />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/methods" element={<MethodManager />} />
        </Routes>
        <AppNavigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
