import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart
} from 'recharts';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import InfoTooltip from '../components/InfoTooltip';
import TrendingStocks from '../components/TrendingStocks';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

// UC-08 interface
interface MarketData {
  currentPrice: number;
  chartData: Array<{ day: string; SPY: number; sentiment: number }>;
}

// UC-17 interfaces
interface StockMetric {
  symbol: string;
  price: string;
  dailyChange: number;
}

interface ComparisonResult {
  metrics: StockMetric;
  history: Record<string, unknown>[];
}

export default function MarketsPage() {
  // UC-08: Live SPY state
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UC-17 Logic States
  const [compareInput, setCompareInput] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorCompare, setErrorCompare] = useState<string | null>(null);

  // UC-08: Fetch real SPY data on mount to serve as our S&P 500 proxy
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stock/SPY`);
        const json = await res.json();

        if (res.ok && json.status === 'success') {
          const { currentPrice, graph_data } = json.data;

          const formattedData = graph_data.historical_prices.map((price: number, idx: number) => ({
            day: `Day ${idx + 1}`,
            SPY: price,
            sentiment: graph_data.historical_sentiment[idx] ?? 0
          }));

          setMarketData({ currentPrice, chartData: formattedData });
        } else {
          setError(json.message || "Failed to load market data.");
        }
      } catch {
        setError("Network error while fetching market data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, []);

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
    } catch {
      setErrorCompare("Server error. Ensure the Python backend is running.");
    } finally {
      setLoadingCompare(false);
    }
  };

  // Transformation Logic for Multi-Line Chart
  const chartData = comparisonData.length > 0 ? comparisonData[0].history.map((day: Record<string, unknown>, i: number) => {
    const point: Record<string, unknown> = { date: day.date };
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
        subtitle="Live tracking of major indices and trending social sentiment."
      />

      {/* UC-08: Live Market Pulse Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>

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
                  <YAxis
                    yAxisId="left"
                    stroke="#38bdf8"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
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
                  <Bar
                    yAxisId="right"
                    dataKey="sentiment"
                    fill="#4ade80"
                    opacity={0.3}
                    radius={[4, 4, 0, 0]}
                    name="Market Sentiment"
                  />
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

        {/* UC-08: Trending Stocks Component */}
        <TrendingStocks />

      </section>

      {/* UC-17 Market Comparison Tool */}
      <div style={{ padding: '0 24px', maxWidth: '1600px', margin: '0 auto' }}>
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
