import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import InfoTooltip from '../components/InfoTooltip';
import TrendingStocks from '../components/TrendingStocks';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MarketData {
  currentPrice: number;
  chartData: Array<{ day: string; SPY: number; sentiment: number }>;
}

export default function MarketsPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real SPY data on mount to serve as our S&P 500 proxy
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stock/SPY`);
        const json = await res.json();

        if (res.ok && json.status === 'success') {
          const { currentPrice, graph_data } = json.data;
          
          // Map backend arrays into Recharts object format
          const formattedData = graph_data.historical_prices.map((price: number, idx: number) => ({
            day: `Day ${idx + 1}`,
            SPY: price,
            sentiment: graph_data.historical_sentiment[idx] || 50 // Fallback if sentiment is missing
          }));

          setMarketData({
            currentPrice,
            chartData: formattedData
          });
        } else {
          setError(json.message || "Failed to load market data.");
        }
      } catch (err) {
        setError("Network error while fetching market data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  return (
    <Layout>
      <TopBar
        title="Markets Overview"
        subtitle="Live tracking of major indices and trending social sentiment."
      />

      {/* Main Hub Layout - Stacked Vertically */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TOP WIDGET: Market Pulse (S&P 500) */}
        <article className="card hero-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>S&P 500 (SPY)</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p className="muted-label" style={{ margin: 0 }}>Market Pulse: 5-Day Price vs. Sentiment</p>
                <InfoTooltip content={TOOLTIP_COPY.MARKET_SENTIMENT || "Comparing market price against social hype."} />
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              {isLoading ? (
                <span style={{ color: '#94a3b8' }}>Loading live data...</span>
              ) : marketData ? (
                <strong style={{ fontSize: '2rem', display: 'block' }}>
                  ${marketData.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              ) : (
                <span style={{ color: '#ef4444' }}>Data unavailable</span>
              )}
            </div>
          </div>

          {/* DUAL-AXIS INDEX GRAPH */}
          <div style={{ height: '350px', width: '100%' }}>
            {isLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div className="animate-pulse">Fetching market pulse...</div>
              </div>
            ) : error ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                {error}
              </div>
            ) : marketData && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={marketData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  
                  {/* Left Y-Axis: Index Price */}
                  <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`} 
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
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  
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
                    dataKey="SPY" 
                    stroke="#38bdf8" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                    name="SPY Price" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* BOTTOM WIDGET: Trending Stocks Component */}
        <TrendingStocks />
        
      </section>
    </Layout>
  );
}