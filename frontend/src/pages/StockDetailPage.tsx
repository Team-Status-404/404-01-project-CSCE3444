import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import HypeMeter from '../components/HypeMeter';
import AlertBell from '../components/AlertBell';
import { useAuth } from '../context/AuthContext';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  movingAverage5Day: number | null;
  volatility: number | null;
  volume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  sector: string | null;
  divergence_warning_active?: boolean;
  graph_data?: {
    historical_prices: number[];
    historical_sentiment: number[];
  };
}

export default function StockDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ticker } = useParams<{ ticker: string }>();
  const displayTicker = (ticker || 'NVDA').toUpperCase();

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // ==========================================
  // UC-09: LIVE PRICE STATE (Jeel Patel - Sprint 3)
  // ==========================================
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [priceStatus, setPriceStatus] = useState<'live' | 'stale' | 'error'>('live');
  const prevPriceRef = useRef<number | null>(null);

  // Fetch all stock data (including the new graph arrays) from the backend
  useEffect(() => {
    setLoading(true);
    setPageError(null);

    fetch(`${API_BASE}/api/stock/${displayTicker}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          setStockData(result.data);
          setLivePrice(result.data.currentPrice);
          prevPriceRef.current = result.data.currentPrice;
        } else {
          setPageError(result.message || 'Could not find that ticker.');
        }
      })
      .catch(() => setPageError('Network error — could not reach the server.'))
      .finally(() => setLoading(false));
  }, [displayTicker]);

  // ==========================================
  // UC-09: SSE STREAM CONNECTION (Jeel Patel - Sprint 3)
  // Connects to the backend SSE endpoint and listens for
  // live price updates. Triggers green/red flash animation
  // when the price changes. Auto-reconnects if connection drops.
  // ==========================================
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/api/stocks/${displayTicker}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === 'live' && data.currentPrice != null) {
          const newPrice = data.currentPrice;
          setPriceStatus('live');

          // Trigger green/red flash animation by comparing with previous price
          if (prevPriceRef.current !== null && newPrice !== prevPriceRef.current) {
            setPriceFlash(newPrice > prevPriceRef.current ? 'up' : 'down');
            // Remove flash class after 1 second so it can re-trigger
            setTimeout(() => setPriceFlash(null), 1000);
          }

          prevPriceRef.current = newPrice;
          setLivePrice(newPrice);
        } else if (data.status === 'stale') {
          setPriceStatus('stale');
        } else if (data.status === 'error') {
          setPriceStatus('error');
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setPriceStatus('stale');
      // EventSource will auto-reconnect by default
    };

    // Cleanup: close the SSE connection when the user leaves this page
    return () => {
      eventSource.close();
    };
  }, [displayTicker]);

  // Handle adding the stock to the user's watchlist
  const handleAddStock = async () => {
    if (!user) return;
    setIsAdding(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/add`, {
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

  // Dynamically format the backend arrays for Recharts
  const chartData = stockData?.graph_data 
    ? stockData.graph_data.historical_prices.map((price, index) => ({
        day: `Day ${index + 1}`,
        price: price,
        sentiment: stockData.graph_data!.historical_sentiment[index]
      })) 
    : [];

  // ==========================================
  // UC-09: HELPER — Get the display price and flash style
  // ==========================================
  const displayPrice = livePrice ?? stockData?.currentPrice ?? null;

  const getPriceStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontSize: '2.5rem',
      display: 'block',
      transition: 'color 0.3s ease',
    };

    if (priceFlash === 'up') {
      return { ...base, color: '#4ade80' }; // green flash
    } else if (priceFlash === 'down') {
      return { ...base, color: '#ef4444' }; // red flash
    }
    return base;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading asset data...</div>
      </Layout>
    );
  }

  if (pageError) {
    return (
      <Layout>
        <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>{pageError}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar
        title="Stock Analysis"
        subtitle="Deep dive into market sentiment and price action."
      />

      {/* Navigation & Feedback Area */}
      <div style={{ padding: '0 24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <article className="card hero-card" style={{ padding: '24px', border: stockData?.divergence_warning_active ? '2px solid #ef4444' : '1px solid #1e293b' }}>
            
            {/* Visual Warning Alert Banner (FR-03) */}
            {stockData?.divergence_warning_active && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span>⚠️</span> The price trend and sentiment trend have critically diverged.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{displayTicker}</h2>
                  <AlertBell ticker={displayTicker} />
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
                <p className="muted-label" style={{ margin: '5px 0 0 0' }}>
                  {stockData?.companyName || 'Company Overview'}
                </p>
                {stockData?.sector && (
                  <span style={{
                    display: 'inline-block', marginTop: '8px',
                    color: '#38bdf8', fontSize: '0.78rem',
                    background: '#0c2a3a', padding: '2px 10px', borderRadius: '4px'
                  }}>
                    {stockData.sector}
                  </span>
                )}
              </div>

              {/* UC-09: LIVE PRICE DISPLAY WITH FLASH ANIMATION */}
              <div style={{ textAlign: 'right' }}>
                <strong style={getPriceStyle()}>
                  {displayPrice ? `$${displayPrice.toFixed(2)}` : 'N/A'}
                </strong>

                {/* UC-09: Live/Stale Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                  {priceStatus === 'live' && (
                    <>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: '#4ade80',
                        display: 'inline-block',
                        animation: 'pulse 2s infinite'
                      }} />
                      <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 'bold' }}>LIVE</span>
                    </>
                  )}
                  {priceStatus === 'stale' && (
                    <>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                        display: 'inline-block'
                      }} />
                      <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>Price Stale</span>
                    </>
                  )}
                  {priceStatus === 'error' && (
                    <>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        display: 'inline-block'
                      }} />
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>Market Closed</span>
                    </>
                  )}
                </div>

                {stockData?.movingAverage5Day && (
                  <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                    5-Day MA: <strong style={{ color: '#38bdf8' }}>${stockData.movingAverage5Day.toFixed(2)}</strong>
                  </span>
                )}
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

            {/* Dual-Axis Price vs Sentiment Graph using live chartData */}
            <div style={{ height: '350px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#38bdf8" domain={['auto', 'auto']} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.3} radius={[4, 4, 0, 0]} name="Hype Score (0-100)" />
                  <Line yAxisId="left" type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Closing Price" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Bottom Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <article className="card stat-card">
              <p className="muted-label">Volatility</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0' }}>
                {stockData?.volatility ? `${stockData.volatility}%` : 'N/A'}
              </strong>
            </article>
            <article className="card stat-card">
              <p className="muted-label">52W High</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0', color: '#4ade80' }}>
                {stockData?.fiftyTwoWeekHigh ? `$${stockData.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A'}
              </strong>
            </article>
            <article className="card stat-card">
              <p className="muted-label">52W Low</p>
              <strong style={{ fontSize: '1.4rem', display: 'block', margin: '8px 0', color: '#ef4444' }}>
                {stockData?.fiftyTwoWeekLow ? `$${stockData.fiftyTwoWeekLow.toFixed(2)}` : 'N/A'}
              </strong>
            </article>
          </div>
        </div>

        {/* RIGHT COLUMN */}
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
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>{stockData?.companyName || displayTicker} announces strategic market expansion.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Reuters • 2h ago</span>
              </div>
              <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>Why Wall Street analysts are adjusting targets for {displayTicker}.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CNBC • 4h ago</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* UC-09: CSS Animation for the pulsing green LIVE dot */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}