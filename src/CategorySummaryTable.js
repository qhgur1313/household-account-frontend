import React, { useEffect, useRef, useState } from "react";
import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js";
import styles from "./CategorySummaryTable.module.css";

Chart.register(PieController, ArcElement, Tooltip, Legend);

function getDefaultMonthRange() {
  // 오늘을 KST 기준으로 구함
  const now = new Date();
  const kstOffset = 9 * 60; // 분
  const localOffset = now.getTimezoneOffset();
  const diff = (kstOffset + localOffset) * 60 * 1000;
  const kstNow = new Date(now.getTime() + diff);

  const year = kstNow.getFullYear();
  const month = kstNow.getMonth() + 1; // 1~12
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  // 말일 구하기
  const endDate = new Date(year, month, 0); // 다음달 0일 = 이번달 말일
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function CategorySummaryTable() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getDefaultMonthRange().start);
  const [endDate, setEndDate] = useState(getDefaultMonthRange().end);
  const [fetchParams, setFetchParams] = useState({ start: getDefaultMonthRange().start, end: getDefaultMonthRange().end });

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/records?start_date=${fetchParams.start}&end_date=${fetchParams.end}`)
      .then((res) => res.json())
      .then((json) => {
        setRawData(json);
        setLoading(false);
      });
  }, [fetchParams]);

  // 카테고리별 합계 계산
  const categoryMap = {};
  rawData.forEach((row) => {
    if (!categoryMap[row.category]) {
      categoryMap[row.category] = 0;
    }
    categoryMap[row.category] += row.amount;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // 결제수단별 합계 계산
  const paymentMap = {};
  rawData.forEach((row) => {
    if (!paymentMap[row.method]) {
      paymentMap[row.method] = 0;
    }
    paymentMap[row.method] += row.amount;
  });
  const paymentData = Object.entries(paymentMap)
    .map(([method, total]) => ({ method, total }))
    .sort((a, b) => b.total - a.total);

  useEffect(() => {
    if (!loading && categoryData.length > 0 && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const labels = categoryData.map((row) => row.category);
      const data = categoryData.map((row) => row.total);
      const backgroundColor = [
        '#3498db', '#2ecc71', '#e91e63', '#e74c3c', '#8b4513', '#95a5a6', '#e67e22', '#9b59b6', '#f39c12', '#16a085', '#34495e', '#c0392b'
      ];
      chartInstance.current = new Chart(chartRef.current, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: backgroundColor.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
              },
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ₩${value.toLocaleString()} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [loading, rawData]);

  if (loading) return <div>로딩 중...</div>;

  // 총합 계산
  const totalAmount = categoryData.reduce((sum, row) => sum + row.total, 0);
  const totalPayment = paymentData.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💰 가계부</h1>
        <div className={styles["date-range"]}>
          <label>기간: </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate} />
          ~
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
          <button onClick={() => setFetchParams({ start: startDate, end: endDate })}>조회</button>
        </div>
        <div className={styles["total-amount"]}>총 지출: ₩{totalAmount.toLocaleString()}</div>
      </div>
      <div className={styles["summary-cards"]}>
        <div className={styles["summary-card"]}>
          <h3>가장 많이 쓴 카테고리</h3>
          <div className={styles.value}>{categoryData.length > 0 ? categoryData[0].category : '-'}</div>
        </div>
        <div className={styles["summary-card"]}>
          <h3>주요 결제수단</h3>
          <div className={styles.value}>{paymentData.length > 0 ? paymentData[0].method : '-'}</div>
        </div>
        <div className={styles["summary-card"]}>
          <h3>카테고리 수</h3>
          <div className={styles.value}>{categoryData.length}개</div>
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles["section-title"]}>분류별 소비</h2>
        <div className={styles["expense-grid"]}>
          <div>
            <table className={styles["expense-table"]}>
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>금액</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((row, idx) => {
                  const colorList = ['#3498db', '#2ecc71', '#e91e63', '#e74c3c', '#8b4513', '#95a5a6', '#e67e22', '#9b59b6', '#f39c12', '#16a085', '#34495e', '#c0392b'];
                  const percent = ((row.total / totalAmount) * 100).toFixed(1);
                  return (
                    <tr key={row.category}>
                      <td><span className={styles["category-color"]} style={{background: colorList[idx % colorList.length]}}></span>{row.category}</td>
                      <td className={styles.amount}>₩{row.total.toLocaleString()}</td>
                      <td>{percent}%</td>
                    </tr>
                  );
                })}
                <tr className={styles["total-row"]}>
                  <td><strong>총계</strong></td>
                  <td className={styles.amount}><strong>₩{totalAmount.toLocaleString()}</strong></td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles["chart-container"]}>
            <canvas ref={chartRef} id="expenseChart"></canvas>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles["section-title"]}>지출방식별 소비</h2>
        <table className={styles["expense-table"]}>
          <thead>
            <tr>
              <th>결제수단</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((row, idx) => (
              <tr key={row.method}>
                <td><span className={styles["payment-method"]}>{row.method}</span></td>
                <td className={styles.amount}>₩{row.total.toLocaleString()}</td>
              </tr>
            ))}
            <tr className={styles["total-row"]}>
              <td><strong>총계</strong></td>
              <td className={styles.amount}><strong>₩{totalPayment.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategorySummaryTable;
