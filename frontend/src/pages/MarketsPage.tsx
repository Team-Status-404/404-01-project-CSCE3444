import { useState } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  
  // State for Add to Watchlist feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);

  const handleAddStock = async (e: React.MouseEvent, ticker: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!user) return;

    setAddingTicker(ticker);
    
    try {
      const res = await fetch(`http://localhost:5000/api/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          user_id: user.user_id, 
          ticker: ticker 
        })
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        setFeedback({ message: `${ticker} added to your watchlist!`, type: 'success' });
      } else {
        setFeedback({ message: data.message, type: 'error' });
      }
    } catch (err) {
      setFeedback({ message: 'Network error. Could not add stock.', type: 'error' });
    } finally {
      setAddingTicker(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <Layout>
      <TopBar
        title="Markets Overview"
        subtitle="Live tracking of major indices and trending sectors."
      />

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', padding: '0 24px' }}>
        
        {/* LEFT COLUMN: Main Index Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <article className="card hero-card" style={{ padding: '24px', height: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>S&P 500 Index</h2>
                <p className="muted-label" style={{ margin: 0 }}>Market Overview (Price vs. Sentiment)</p>
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

            {/* DUAL-AXIS INDEX GRAPH */}
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockIndexData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  
                  {/* Left Y-Axis: Index Price */}
                  <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    domain={['dataMin - 20', 'dataMax + 20']} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString()} // Formats with commas
                  />
                  
                  {/* Right Y-Axis: Sentiment Score */}
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#4ade80" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                  />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Legend />
                  
                  {/* Faded Bar for Sentiment */}
                  <Bar 
                    yAxisId="right" 
                    dataKey="sentiment" 
                    fill="#4ade80" 
                    opacity={0.3} 
                    radius={[4, 4, 0, 0]} 
                    name="Market Sentiment" 
                  />
                  
                  {/* Line for Index Price */}
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="SP500" 
                    stroke="#38bdf8" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                    name="Index Value" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN: Clickable Trending Stocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <article className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Trending Stocks</h3>
            </div>
            
            {/* Feedback Banner */}
            {feedback && (
              <div style={{ 
                padding: '10px', 
                marginBottom: '15px', 
                borderRadius: '8px', 
                fontSize: '0.9rem',
                backgroundColor: feedback.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: feedback.type === 'success' ? '#4ade80' : '#ef4444',
                border: `1px solid ${feedback.type === 'success' ? '#4ade80' : '#ef4444'}`
              }}>
                {feedback.message}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {trendingStocks.map((stock) => (
                <Link 
                  key={stock.ticker} 
                  to={`/stock/${stock.ticker.toLowerCase()}`} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px', 
                    background: 'rgba(148, 163, 184, 0.05)', 
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #1e293b',
                    transition: 'border 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.border = '1px solid #38bdf8';
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.border = '1px solid #1e293b';
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.2rem' }}>{stock.ticker}</strong>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{stock.name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>{stock.price}</strong>
                      <span className={stock.isUp ? 'positive-text' : 'negative-text'} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {stock.change}
                      </span>
                    </div>
                    
                    {/* Add to Watchlist Button */}
                    <button
                      onClick={(e) => handleAddStock(e, stock.ticker)}
                      disabled={addingTicker === stock.ticker}
                      style={{
                        background: '#334155',
                        color: '#f8fafc',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: addingTicker === stock.ticker ? 'not-allowed' : 'pointer',
                        fontSize: '1.2rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#38bdf8'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#334155'}
                      title="Add to Watchlist"
                    >
                      {addingTicker === stock.ticker ? '...' : '+'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </div>
        
      </section>
    </Layout>
  );
}