import React, { useState, useEffect } from "react";

interface HypeMeterProps {
  symbol: string;
}

export default function HypeMeter({ symbol }: HypeMeterProps) {
  const [score, setScore] = useState<number>(0);
  const [signals, setSignals] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Alert modal state
  const [showAlert, setShowAlert] = useState(false);
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');
  const [alertThreshold, setAlertThreshold] = useState(80);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/sentiment/${symbol}`);
        const data = await res.json();
        setScore(data.hype_score || 50);
        setSignals((data.metrics?.social_volume || 0) + (data.metrics?.news_volume || 0));
      } catch {
        setScore(50);
        setSignals(0);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [symbol]);

  const color = score > 70 ? '#FF4D6D' : score > 40 ? '#FFD166' : '#00E5A0';
  const label = score > 70 ? 'HOT' : score > 40 ? 'WARM' : 'COOL';
  const sentiment = score > 65 ? 'Positive' : score <= 35 ? 'Negative' : 'Neutral';

  const handleSaveAlert = () => {
    // Wire up to your /api/watchlist/alert endpoint if needed
    console.log(`Alert set for ${symbol}: ${alertDirection} ${alertThreshold}`);
    setShowAlert(false);
  };

  return (
    <div style={{ position: 'relative' }}>

      {/* Top row: ticker dot + name + Alert button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{symbol}</span>
        </div>
        <button
          onClick={() => setShowAlert(true)}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            color: '#94a3b8',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          + Alert
        </button>
      </div>

      {/* Ticker input display */}
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '6px 12px',
        color: 'white',
        fontSize: '0.85rem',
        marginBottom: '16px',
      }}>
        {symbol}
      </div>

      {/* Gauge */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={251 - (251 * score) / 100}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>

        {/* Score + label */}
        <div style={{ marginTop: '-55px' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>
            {loading ? '...' : score}
          </div>
          <div style={{ color: color, fontWeight: 'bold', letterSpacing: '2px', fontSize: '13px', marginTop: '4px' }}>
            {label}
          </div>
        </div>
      </div>

      {/* SENTIMENT + SIGNALS row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sentiment</div>
          <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginTop: '2px' }}>{sentiment}</div>
        </div>
        <div style={{ width: '1px', background: '#1e293b' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Signals</div>
          <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginTop: '2px' }}>{signals} detected</div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            width: '260px',
          }}>
            <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', fontSize: '1rem' }}>
              Set Alert for {symbol}
            </h4>

            {/* Above / Below toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setAlertDirection('above')}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px', border: 'none',
                  background: alertDirection === 'above' ? '#38bdf8' : '#1e293b',
                  color: 'white', cursor: 'pointer', fontWeight: '600',
                }}
              >
                Above
              </button>
              <button
                onClick={() => setAlertDirection('below')}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px', border: 'none',
                  background: alertDirection === 'below' ? '#38bdf8' : '#1e293b',
                  color: 'white', cursor: 'pointer', fontWeight: '600',
                }}
              >
                Below
              </button>
            </div>

            {/* Threshold slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '8px' }}>
                Threshold Score (0-100)
              </div>
              <input
                type="range"
                min={0} max={100}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>
                {alertThreshold}
              </div>
            </div>

            {/* Cancel / Save */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px', border: '1px solid #334155',
                  background: 'transparent', color: 'white', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAlert}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '8px', border: 'none',
                  background: '#38bdf8', color: 'white',
                  cursor: 'pointer', fontWeight: '600',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}