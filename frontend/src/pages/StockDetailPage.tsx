import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import HypeMeter from '../components/HypeMeter';
import { useAuth } from '../context/AuthContext';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Updated mock data to include both price and sentiment over a 5-day span
const mockChartData = [
  { day: 'Day 1', price: 902.50, sentiment: 65 },
  { day: 'Day 2', price: 915.20, sentiment: 70 },
  { day: 'Day 3', price: 910.80, sentiment: 45 },
  { day: 'Day 4', price: 920.10, sentiment: 80 },
  { day: 'Day 5', price: 924.79, sentiment: 88 },
];

export default function StockDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Grab the ticker from the URL. Fallback to NVDA if testing.
  const { ticker } = useParams<{ ticker: string }>();
  const displayTicker = (ticker || 'NVDA').toUpperCase();

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // The Add to Watchlist API Call
  const handleAddStock = async () => {
    if (!user) return;
    setIsAdding(true);
    
    try {
      const res = await fetch(`http://localhost:5000/api/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          user_id: user.user_id, 
          ticker: displayTicker 
        })
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        setFeedback({ message: `${displayTicker} added to your watchlist!`, type: 'success' });
      } else {
        setFeedback({ message: data.message, type: 'error' });
      }
    } catch (err) {
      console.error('Error:', err);
      setFeedback({ message: 'Network error. Could not add stock.', type: 'error' });
    } finally {
      setIsAdding(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <Layout>
      <TopBar
        title="Stock Analysis"
        subtitle="Deep dive into market sentiment and price action."
      />

      {/* Navigation & Feedback Area */}
      <div style={{ padding: '0 24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* The Back Button */}
        <div>
          <button 
            onClick={() => navigate(-1)} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1rem',
              padding: 0,
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <span>←</span> Back to Markets
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            backgroundColor: feedback.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: feedback.type === 'success' ? '#4ade80' : '#ef4444',
            border: `1px solid ${feedback.type === 'success' ? '#4ade80' : '#ef4444'}`
          }}>
            {feedback.message}
          </div>
        )}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', padding: '0 24px' }}>
        
        {/* ========================================== */}
        {/* LEFT COLUMN: Chart & Lower Metrics         */}
        {/* ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <article className="card hero-card" style={{ padding: '24px' }}>
            {/* Header: Dynamic Price and Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{displayTicker}</h2>
                  <button 
                    onClick={handleAddStock}
                    disabled={isAdding}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#38bdf8',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      cursor: isAdding ? 'not-allowed' : 'pointer',
                      opacity: isAdding ? 0.7 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    {isAdding ? 'Adding...' : '+ Watchlist'}
                  </button>
                </div>
                <p className="muted-label" style={{ margin: '5px 0 0 0' }}>Company Overview</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '2.5rem', display: 'block' }}>$924.79</strong>
                <span className="positive-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+2.48% (+$22.41)</span>
              </div>
            </div>

            {/* Timeframe Toggles */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((tf) => (
                <button 
                  key={tf} 
                  style={{
                    background: tf === '1W' ? '#38bdf8' : 'transparent',
                    color: tf === '1W' ? '#fff' : '#94a3b8',
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

            {/* Dual-Axis Price vs Sentiment Graph */}
            <div style={{ height: '350px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  
                  {/* Left Y-Axis: Price */}
                  <YAxis yAxisId="left" stroke="#38bdf8" domain={['auto', 'auto']} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  
                  {/* Right Y-Axis: Sentiment Score (0-100) */}
                  <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Legend />
                  
                  <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.3} radius={[4, 4, 0, 0]} name="Hype Score (0-100)" />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="price" 
                    stroke="#38bdf8" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                    name="Closing Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Bottom Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <article className="card stat-card">
              <p className="muted-label">Social Volume</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0' }}>Extremely High</strong>
              <span className="positive-text">Trending #1 on X</span>
            </article>
            <article className="card stat-card">
              <p className="muted-label">Retail Sentiment</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0' }}>78% Bullish</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Based on Reddit/WSB</span>
            </article>
            <article className="card stat-card">
              <p className="muted-label">Whale Alerts</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0' }}>3 Active</strong>
              <span className="positive-text">Large call volume detected</span>
            </article>
          </div>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: Hype Meter & News            */}
        {/* ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <article className="card hype-meter-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <h3 style={{ width: '100%', marginBottom: '10px', margin: 0 }}>AI Hype Meter</h3>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <HypeMeter />
            </div>
          </article>

          <article className="card info-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '20px', margin: 0 }}>Recent News</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>{displayTicker} announces next-generation AI chips, expanding datacenter dominance.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Reuters • 2h ago</span>
              </div>
              <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>Why Wall Street analysts remain ultra-bullish on {displayTicker} despite record highs.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CNBC • 4h ago</span>
              </div>
              <div>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>Semiconductor stocks rally globally as tech spending forecasts increase.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Bloomberg • 6h ago</span>
              </div>
            </div>
          </article>

        </div>
      </section>
    </Layout>
  );
}