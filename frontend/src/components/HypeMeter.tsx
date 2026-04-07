import React, { useState, useEffect } from "react";

// This interface fixes the "red things" in StockDetailPage.tsx
interface HypeMeterProps {
  symbol: string;
}

export default function HypeMeter({ symbol }: HypeMeterProps) {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/sentiment/${symbol}`);
        const data = await res.json();
        // Sets the score from your Python API
        setScore(data.hype_score || 50);
      } catch (e) {
        setScore(50); // Fallback if API is down
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [symbol]); // Refetches whenever you search a new ticker

  // Dynamic colors based on the hype score
  const color = score > 70 ? "#FF4D6D" : score > 40 ? "#FFD166" : "#00E5A0";
  const label = score > 70 ? "HOT" : score > 40 ? "WARM" : "COOL";

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      {/* THE VISUAL GAUGE */}
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset={251 - (251 * score) / 100}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>

      {/* TEXT OVERLAY */}
      <div style={{ marginTop: '-60px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
          {loading ? "..." : score}
        </div>
        <div style={{ color: color, fontWeight: 'bold', letterSpacing: '2px', fontSize: '14px' }}>
          {label}
        </div>
        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '15px', textTransform: 'uppercase' }}>
          {symbol} SENTIMENT
        </div>
      </div>
    </div>
  );
}