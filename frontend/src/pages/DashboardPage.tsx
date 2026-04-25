import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import InfoTooltip from '../components/InfoTooltip';
import { useAuth } from '../context/AuthContext';
import { useTour } from '../context/TourContext';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define the shape of our incoming backend data
interface WatchlistData {
  ticker: string;
  current_price: number;
  ma_5_day: number;
  divergence_warning_active: boolean;
  graph_data: {
    historical_prices: number[];
    historical_sentiment: number[];
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { startTour } = useTour();
  const [watchlist, setWatchlist] = useState<WatchlistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State to track which stock is currently displayed in the Dual-Axis Graph
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  // Check onboarding status to decide whether to show the tour (UC-14)
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE}/api/user/profile`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data.status === 'success' && data.has_completed_onboarding === false) {
          startTour();
        }
      } catch {
        // fail silently — never block the dashboard
      }
    }
    checkOnboardingStatus();
  }, [user]); // eslint-disable-line

  // ==========================================
  // UC-09: LIVE PRICE STATE FOR DASHBOARD CARDS (Jeel Patel - Sprint 3)
  // Stores the latest live price for each ticker in the watchlist.
  // Also tracks flash animation state per ticker.
  // ==========================================
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        const res = await fetch(`${API_BASE}/api/user/watchlist?user_id=${user.user_id}`);
        const data = await res.json();
        
        if (data.status === 'success') {
          setWatchlist(data.watchlist);
          // Set the first stock in the watchlist as the default active graph
          if (data.watchlist.length > 0) {
            setActiveTicker(data.watchlist[0].ticker);
          }
          // Initialize live prices with the values from the watchlist API
          const initialPrices: Record<string, number> = {};
          data.watchlist.forEach((stock: WatchlistData) => {
            initialPrices[stock.ticker] = stock.current_price;
          });
          setLivePrices(initialPrices);
          prevPricesRef.current = { ...initialPrices };
        } else {
          setError(data.message || 'Failed to load watchlist.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Network error: Could not reach the server.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  // ==========================================
  // UC-09: SSE STREAMS FOR EACH WATCHLIST STOCK
  // Opens one SSE connection per ticker in the watchlist.
  // Updates the live price and triggers flash animations.
  // Connections are cleaned up when the component unmounts.
  // ==========================================
  useEffect(() => {
    if (watchlist.length === 0) return;

    const eventSources: EventSource[] = [];

    watchlist.forEach((stock) => {
      const es = new EventSource(`${API_BASE}/api/stocks/${stock.ticker}/stream`);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === 'live' && data.currentPrice != null) {
            const newPrice = data.currentPrice;
            const prevPrice = prevPricesRef.current[stock.ticker];

            // Trigger flash animation
            if (prevPrice != null && newPrice !== prevPrice) {
              setPriceFlashes(prev => ({
                ...prev,
                [stock.ticker]: newPrice > prevPrice ? 'up' : 'down'
              }));
              setTimeout(() => {
                setPriceFlashes(prev => ({ ...prev, [stock.ticker]: null }));
              }, 1000);
            }

            prevPricesRef.current[stock.ticker] = newPrice;
            setLivePrices(prev => ({ ...prev, [stock.ticker]: newPrice }));
          }
        } catch (err) {
          console.error(`Dashboard SSE error for ${stock.ticker}:`, err);
        }
      };

      es.onerror = () => {
        // SSE auto-reconnects, keep showing last known price
      };

      eventSources.push(es);
    });

    // Cleanup all SSE connections when component unmounts or watchlist changes
    return () => {
      eventSources.forEach(es => es.close());
    };
  }, [watchlist]);

  // --- CHART DATA FORMATTING ---
  // Recharts requires an array of objects, so we zip the price and sentiment arrays together
  const activeStock = watchlist.find(s => s.ticker === activeTicker);
  const chartData = activeStock ? activeStock.graph_data.historical_prices.map((price, index) => ({
    day: `Day ${index + 1}`,
    price: price,
    sentiment: activeStock.graph_data.historical_sentiment[index]
  })) : [];

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8' }}>
          <h2>Loading your market intelligence...</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar
        title="Market Intelligence"
        subtitle={watchlist.length === 0 ? "Your watchlist is empty." : "Real-time overview of your tracked assets."}
      />

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', margin: '20px 0', color: '#f8fafc' }}>
          {error}
        </div>
      )}

      {/* --- WATCHLIST GRID --- */}
      <section className="section-block" style={{ marginTop: '20px' }}>
        <div data-tour="watchlist-section" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 15 }}>
          <h2 style={{ margin: 0 }}>My Watchlist</h2>
          <InfoTooltip content={TOOLTIP_COPY.WATCHLIST_SECTION} id="tour-info-tooltip-demo" />
        </div>
        
        {watchlist.length === 0 && !error ? (
          <p style={{ color: '#94a3b8' }}>You aren't tracking any stocks yet. Go to Markets to add some!</p>
        ) : (
          <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {watchlist.map((stock) => {
              // UC-09: Use live price if available, fallback to original
              const currentDisplayPrice = livePrices[stock.ticker] ?? stock.current_price;
              const flash = priceFlashes[stock.ticker];

              return (
                <div 
                  key={stock.ticker} 
                  onClick={() => setActiveTicker(stock.ticker)}
                  style={{ 
                    padding: '20px', 
                    backgroundColor: activeTicker === stock.ticker ? '#1e293b' : '#0f172a', 
                    borderRadius: '12px', 
                    border: activeTicker === stock.ticker ? '2px solid #38bdf8' : '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Visual Warning Alert Banner (FR-03) combined with UC-14 info tooltips */}
                  {stock.divergence_warning_active && (
                    <div data-tour="divergence-warning" style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', padding: '4px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span>⚠️ DIVERGENCE WARNING</span>
                      <InfoTooltip content={TOOLTIP_COPY.DIVERGENCE_WARNING} id="tooltip-divergence" />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: stock.divergence_warning_active ? '15px' : '0' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc' }}>{stock.ticker}</h2>
                    {/* UC-09: Live price with flash animation */}
                    <h3 style={{ 
                      margin: 0, 
                      color: flash === 'up' ? '#4ade80' : flash === 'down' ? '#ef4444' : '#4ade80',
                      transition: 'color 0.3s ease'
                    }}>
                      ${currentDisplayPrice.toFixed(2)}
                    </h3>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      5D MA <InfoTooltip content={TOOLTIP_COPY.DASHBOARD_MA} />:
                    </span>
                    <span>${stock.ma_5_day.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- DUAL-AXIS GRAPH (FR-12) --- */}
      {activeStock && (
        <section className="section-block" style={{ marginTop: '40px' }}>
          <article className="card" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', border: activeStock.divergence_warning_active ? '2px solid #ef4444' : '1px solid #334155' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{activeStock.ticker} : Price vs. Sentiment</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>5-Day Historical Overlay</p>
              </div>
              
              {/* Secondary Warning Alert for the Graph Area */}
              {activeStock.divergence_warning_active && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> The price trend and sentiment trend have critically diverged.
                  <InfoTooltip content={TOOLTIP_COPY.DIVERGENCE_WARNING} />
                </div>
              )}
            </div>

            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  
                  {/* Left Y-Axis: Mapped to Price */}
                  <YAxis yAxisId="left" stroke="#38bdf8" domain={['auto', 'auto']} tickFormatter={(value) => `$${value}`} />
                  
                  {/* Right Y-Axis: Mapped to Sentiment (0-100) */}
                  <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} />
                  
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Legend />
                  
                  <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.4} radius={[4, 4, 0, 0]} name="Hype Score (0-100)" />
                  <Line yAxisId="left" type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} name="Closing Price" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      )}

    </Layout>
  );
}