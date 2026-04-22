import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface HistoryPoint {
  date: string;
  score: number;
}

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  change_pct: number;
}

interface HypeTrendProps {
  ticker: string;
}

// ─── SKELETON ──────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 20, width: '40%', borderRadius: 4, background: 'rgba(148,163,184,0.1)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 200, borderRadius: 8, background: 'rgba(148,163,184,0.07)', animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function HypeTrend({ ticker }: HypeTrendProps) {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNoData(false);

    fetch(`${API_URL}/api/stocks/${ticker}/hype-history?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          if (data.history.length === 0) {
            setNoData(true);
          } else {
            setHistory(data.history);
            setTrend(data.trend);
          }
        } else {
          setError(data.message || 'Could not load hype history.');
        }
      })
      .catch(() => setError('Network error — could not reach the server.'))
      .finally(() => setLoading(false));
  }, [ticker, period]);

  const trendColor = trend?.direction === 'up' ? '#4ade80' : trend?.direction === 'down' ? '#f87171' : '#94a3b8';
  const trendSymbol = trend?.direction === 'up' ? '▲' : trend?.direction === 'down' ? '▼' : '●';

  return (
    <article className="card" style={{ padding: 24, marginTop: 0 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Hype Score Trend</h3>
          {/* Trend badge */}
          {trend && !loading && !noData && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: trendColor,
              background: `${trendColor}18`,
              border: `1px solid ${trendColor}40`,
              padding: '3px 10px',
              borderRadius: 999,
            }}>
              {trendSymbol} {trend.change_pct > 0 ? '+' : ''}{trend.change_pct}%
            </span>
          )}
        </div>

        {/* Period toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['7', '30', '90'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                border: `1px solid ${period === p ? '#38bdf8' : '#334155'}`,
                background: period === p ? 'rgba(56,189,248,0.12)' : 'transparent',
                color: period === p ? '#38bdf8' : '#94a3b8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error */}
      {!loading && error && (
        <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>⚠ {error}</p>
      )}

      {/* Not enough data */}
      {!loading && !error && noData && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          color: '#94a3b8', fontSize: 14,
          background: 'rgba(148,163,184,0.05)',
          borderRadius: 10, border: '1px dashed #334155'
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>📊</p>
          <p style={{ margin: 0 }}>Not enough data yet for {ticker}.</p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>Check back after {period} days of tracking.</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && !noData && history.length > 0 && (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis
                stroke="#94a3b8"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Hype Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name="Hype Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}