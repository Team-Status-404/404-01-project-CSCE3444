import { useState } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import InfoTooltip from '../components/InfoTooltip';
import { useAuth } from '../context/AuthContext';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart } from 'recharts';
import { Link } from 'react-router-dom';

// Updated to include sentiment data alongside the index price
const mockIndexData = [
  { time: '9:30 AM', SP500: 5050, sentiment: 55 },
  { time: '11:00 AM', SP500: 5080, sentiment: 62 },
  { time: '1:00 PM', SP500: 5065, sentiment: 48 },
  { time: '3:00 PM', SP500: 5090, sentiment: 70 },
  { time: '4:00 PM', SP500: 5104, sentiment: 82 },
];

const trendingStocks = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: '$924.79', change: '+2.48%', isUp: true },
  { ticker: 'SMCI', name: 'Super Micro', price: '$1,024.10', change: '+32.8%', isUp: true },
  { ticker: 'ARM', name: 'ARM Holdings', price: '$129.43', change: '+4.1%', isUp: true },
  { ticker: 'PLTR', name: 'Palantir', price: '$24.50', change: '+1.2%', isUp: true }
];

export default function MarketsPage() {
  const { user } = useAuth();
  
  // Existing Sprint 2 States
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);

  // --- UC-17 NEW STATES ---
  const [compareInput, setCompareInput] = useState('');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const handleAddStock = async (e: React.MouseEvent, ticker: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user) return;
    setAddingTicker(ticker);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ user_id: user.user_id, ticker: ticker })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFeedback({ message: `${ticker} added to your watchlist!`, type: 'success' });
      } else {
        setFeedback({ message: data.message, type: 'error' });
      }
    } catch (err) {
      setFeedback({ message: 'Network error.', type: 'error' });
    } finally {
      setAddingTicker(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // --- UC-17 HANDLER ---
  const handleCompare = async () => {
    if (!compareInput.trim()) return;
    setLoadingCompare(true);
    const tickerList = compareInput.split(/[ ,]+/).filter(t => t.length > 0);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stocks/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: tickerList })
      });
      const result = await response.json();
      if (result.status === "success") setComparisonData(result.data);
    } catch (error) {
      console.error("Comparison failed", error);
    } finally {
      setLoadingCompare(false);
    }
  };

  // Process data for the comparison chart
  const chartData = comparisonData.length > 0 ? comparisonData[0].history.map((day: any, i: number) => {
    let point: any = { date: day.date };
    comparisonData.forEach(stock => {
      if (stock.history[i]) point[stock.metrics.symbol] = stock.history[i][stock.metrics.symbol];
    });
    return point;
  }) : [];

  return (
    <Layout>
      <TopBar
        title="Markets Overview"
        subtitle="Live tracking of major indices and trending sectors."
      />

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', padding: '0 24px' }}>
        
        {/* LEFT COLUMN: Main Index Chart (Original) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <article className="card hero-card" style={{ padding: '24px', height: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>S&P 500 Index</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p className="muted-label" style={{ margin: 0 }}>Market Overview (Price vs. Sentiment)</p>
                  <InfoTooltip content={TOOLTIP_COPY.MARKET_SENTIMENT} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '2rem', display: 'block' }}>5,104.76</strong>
                <span className="positive-text" style={{ fontWeight: 'bold' }}>+1.03% (+$52.34)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((tf) => (
                <button 
                  key={tf} 
                  style={{
                    background: tf === '1D' ? '#38bdf8' : 'transparent',
                    color: tf === '1D' ? '#fff' : '#94a3b8',
                    border: '1px solid #334155',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockIndexData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#38bdf8" domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.3} radius={[4, 4, 0, 0]} name="Market Sentiment" />
                  <Line yAxisId="left" type="monotone" dataKey="SP500" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Index Value" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN: Clickable Trending Stocks (Original) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <article className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <h3 style={{ margin: 0 }}>Trending Stocks</h3>
                <InfoTooltip content={TOOLTIP_COPY.TRENDING_STOCKS} />
              </div>
            </div>
            {feedback && (
              <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: feedback.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: feedback.type === 'success' ? '#4ade80' : '#ef4444', border: `1px solid ${feedback.type === 'success' ? '#4ade80' : '#ef4444'}` }}>
                {feedback.message}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {trendingStocks.map((stock) => (
                <Link key={stock.ticker} to={`/stock/${stock.ticker.toLowerCase()}`} className="trending-stock-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(148, 163, 184, 0.05)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', border: '1px solid #1e293b' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.2rem' }}>{stock.ticker}</strong>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{stock.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>{stock.price}</strong>
                      <span className={stock.isUp ? 'positive-text' : 'negative-text'} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{stock.change}</span>
                    </div>
                    <button onClick={(e) => handleAddStock(e, stock.ticker)} disabled={addingTicker === stock.ticker} style={{ background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.2rem' }}>
                      {addingTicker === stock.ticker ? '...' : '+'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* --- UC-17 NEW SECTION: MARKET COMPARISON TOOL (AT BOTTOM) --- */}
      <section style={{ padding: '0 24px', marginTop: '24px', marginBottom: '40px' }}>
        <article className="card" style={{ padding: '32px', borderRadius: '24px', background: '#0b1221', border: '2px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Market Comparison Tool (New)</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: comparisonData.length > 0 ? '24px' : '0' }}>
            <input 
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
              placeholder="Enter Tickers separated by space (e.g. AAPL NVDA TSLA)" 
              style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#0f172a', border: '1px solid #374151', color: '#fff' }}
            />
            <button onClick={handleCompare} className="primary-btn" style={{ padding: '0 32px', borderRadius: '12px' }}>
              {loadingCompare ? 'Analyzing...' : 'Compare'}
            </button>
          </div>

          {comparisonData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comparisonData.map(s => (
                  <div key={s.metrics.symbol} style={{ padding: '16px', background: '#1f2937', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{s.metrics.symbol}</div>
                    <div style={{ color: '#94a3b8' }}>Price: ${s.metrics.price}</div>
                    <div style={{ color: s.metrics.dailyChange >= 0 ? '#22c55e' : '#ef4444' }}>{s.metrics.dailyChange}%</div>
                  </div>
                ))}
              </div>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151' }} />
                    <Legend />
                    {comparisonData.map((s, i) => (
                      <Line key={s.metrics.symbol} type="monotone" dataKey={s.metrics.symbol} stroke={['#38bdf8', '#4ade80', '#fbbf24'][i % 3]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </article>
      </section>
    </Layout>
  );
}