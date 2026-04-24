import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, LineChart, Area 
} from 'recharts';

// Component Imports
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import InfoTooltip from '../components/InfoTooltip';
import { useAuth } from '../context/AuthContext';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

// --- TYPES & INTERFACES ---
interface StockMetric {
  symbol: string;
  price: string;
  dailyChange: number;
}

interface ComparisonResult {
  metrics: StockMetric;
  history: any[];
}

// --- SPRINT 2 MOCK DATA (Retained for UI Consistency) ---
const mockIndexData = [
  { time: '09:30', SP500: 5050, sentiment: 55 },
  { time: '11:00', SP500: 5080, sentiment: 62 },
  { time: '13:00', SP500: 5065, sentiment: 48 },
  { time: '15:00', SP500: 5090, sentiment: 70 },
  { time: '16:00', SP500: 5104, sentiment: 82 },
];

const trendingStocks = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: '$924.79', change: '+2.48%', isUp: true },
  { ticker: 'SMCI', name: 'Super Micro', price: '$1,024.10', change: '+32.8%', isUp: true },
  { ticker: 'ARM', name: 'ARM Holdings', price: '$129.43', change: '+4.1%', isUp: true },
  { ticker: 'PLTR', name: 'Palantir', price: '$24.50', change: '+1.2%', isUp: true }
];

export default function MarketsPage() {
  const { user } = useAuth();
  
  // UI States
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);

  // UC-17 Logic States
  const [compareInput, setCompareInput] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorCompare, setErrorCompare] = useState<string | null>(null);

  // --- HANDLERS ---

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
        setFeedback({ message: `${ticker} successfully added to your watchlist!`, type: 'success' });
      } else {
        setFeedback({ message: data.message || 'Failed to add stock.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ message: 'Network error. Please check your connection.', type: 'error' });
    } finally {
      setAddingTicker(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCompare = async () => {
    const tickers = compareInput.toUpperCase().split(/[ ,]+/).filter(t => t.length > 0);
    if (tickers.length === 0) {
      setErrorCompare("Please enter at least one ticker symbol.");
      return;
    }

    setLoadingCompare(true);
    setErrorCompare(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stocks/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setComparisonData(result.data);
      } else {
        setErrorCompare(result.message || "Could not fetch comparison data.");
      }
    } catch (error) {
      setErrorCompare("Server error. Ensure the Python backend is running.");
    } finally {
      setLoadingCompare(false);
    }
  };

  // Transformation Logic for Multi-Line Chart
  const chartData = comparisonData.length > 0 ? comparisonData[0].history.map((day: any, i: number) => {
    let point: any = { date: day.date };
    comparisonData.forEach(stock => {
      if (stock.history[i]) {
        point[stock.metrics.symbol] = stock.history[i][stock.metrics.symbol];
      }
    });
    return point;
  }) : [];

  return (
    <Layout>
      <TopBar 
        title="Markets Overview" 
        subtitle="Real-time performance tracking and comparative market intelligence." 
      />

      <div style={{ padding: '0 24px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* UPPER SECTION: Sprint 2 Market Summary */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
          
          {/* Main Index Card */}
          <article className="card" style={{ padding: '28px', minHeight: '480px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: '1.75rem' }}>S&P 500 Index</h2>
                  <InfoTooltip content={TOOLTIP_COPY.MARKET_SENTIMENT} />
                </div>
                <p className="muted-label" style={{ marginTop: '4px' }}>Daily Momentum & Sentiment Analysis</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '2.25rem', lineHeight: 1 }}>5,104.76</strong>
                <span className="positive-text" style={{ fontWeight: 600, display: 'block', marginTop: '4px' }}>
                  +1.03% (+$52.34)
                </span>
              </div>
            </div>

            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockIndexData}>
                  <defs>
                    <linearGradient id="colorSP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" stroke="#38bdf8" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '14px' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area yAxisId="left" type="monotone" dataKey="SP500" stroke="#38bdf8" fillOpacity={1} fill="url(#colorSP)" name="Index Price" />
                  <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.2} radius={[4, 4, 0, 0]} name="Market Mood" />
                  <Line yAxisId="left" type="monotone" dataKey="SP500" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Trending Sidebar */}
          <article className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Trending Activity</h3>
              <InfoTooltip content={TOOLTIP_COPY.TRENDING_STOCKS} />
            </div>

            {feedback && (
              <div className={`feedback-message ${feedback.type}`} style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                {feedback.message}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trendingStocks.map((stock) => (
                <Link key={stock.ticker} to={`/stock/${stock.ticker.toLowerCase()}`} className="trending-item-row" style={{ textDecoration: 'none' }}>
                  <div className="trending-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: '#1e293b50', transition: 'background 0.2s' }}>
                    <div>
                      <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>{stock.ticker}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{stock.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{stock.price}</div>
                        <div className="positive-text" style={{ fontSize: '0.85rem' }}>{stock.change}</div>
                      </div>
                      <button 
                        onClick={(e) => handleAddStock(e, stock.ticker)}
                        className="icon-add-btn"
                        disabled={addingTicker === stock.ticker}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#334155', color: 'white', cursor: 'pointer' }}
                      >
                        {addingTicker === stock.ticker ? '...' : '+'}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        {/* LOWER SECTION: UC-17 Market Comparison Tool */}
        <section style={{ paddingBottom: '60px' }}>
          <article className="card" style={{ padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '24px' }}>
              <div style={{ background: '#38bdf8', width: '4px', height: '24px', borderRadius: '2px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Market Comparison Tool</h3>
              <InfoTooltip content={TOOLTIP_COPY.MARKET_COMPARISON} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                  placeholder="Enter tickers to compare (e.g. AAPL, TSLA, MSFT)" 
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '1rem' }}
                />
                {errorCompare && <p style={{ color: '#ef4444', fontSize: '0.85rem', position: 'absolute', bottom: '-22px', left: '4px' }}>{errorCompare}</p>}
              </div>
              <button 
                onClick={handleCompare} 
                disabled={loadingCompare}
                className="primary-btn" 
                style={{ padding: '0 40px', borderRadius: '14px', fontWeight: 600 }}
              >
                {loadingCompare ? 'Analyzing...' : 'Compare Assets'}
              </button>
            </div>

            {comparisonData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', marginTop: '20px', animation: 'fadeIn 0.5s ease-in' }}>
                
                {/* Comparison Stats Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {comparisonData.map((s, idx) => (
                    <div key={s.metrics.symbol} style={{ padding: '20px', borderRadius: '16px', background: '#1e293b40', borderLeft: `4px solid ${['#38bdf8', '#4ade80', '#fbbf24', '#a855f7'][idx % 4]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '1.25rem' }}>{s.metrics.symbol}</strong>
                        <span className={s.metrics.dailyChange >= 0 ? 'positive-text' : 'negative-text'} style={{ fontWeight: 600 }}>
                          {s.metrics.dailyChange > 0 ? '+' : ''}{s.metrics.dailyChange}%
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Current Price: <strong>${s.metrics.price}</strong></div>
                    </div>
                  ))}
                </div>

                {/* The Comparison Chart */}
                <div style={{ height: '350px', background: '#0f172a40', borderRadius: '20px', padding: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Relative Growth (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '12px' } }} />
                      <Tooltip 
                        contentStyle={{ background: '#0b1221', border: '1px solid #1e293b', borderRadius: '10px' }} 
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      {comparisonData.map((s, i) => (
                        <Line 
                          key={s.metrics.symbol} 
                          type="monotone" 
                          dataKey={s.metrics.symbol} 
                          stroke={['#38bdf8', '#4ade80', '#fbbf24', '#a855f7'][i % 4]} 
                          strokeWidth={2.5} 
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </article>
        </section>
      </div>
    </Layout>
  );
}