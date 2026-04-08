import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import HypeMeter from '../components/HypeMeter';

const API_BASE = 'http://localhost:5000';

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
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const ticker = symbol?.toUpperCase() || 'NVDA';

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ KEY FIX: [ticker] in the dependency array means this re-runs
  // every time the URL changes (AAPL → TSLA → GOOG etc.)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setStockData(null);

    fetch(`${API_BASE}/api/stock/${ticker}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          setStockData(result.data);
        } else {
          setError(result.message || 'Could not find that ticker.');
        }
      })
      .catch(() => setError('Network error — is your Flask server running on port 5000?'))
      .finally(() => setLoading(false));
  }, [ticker]); // <-- reruns whenever ticker changes

  const fmt = (n: number | null) =>
    n != null ? `$${n.toFixed(2)}` : 'N/A';

  const fmtMarketCap = (v: number | null) => {
    if (!v) return 'N/A';
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toLocaleString()}`;
  };

  const fmtVolume = (v: number | null) => {
    if (!v) return 'N/A';
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toString();
  };

  return (
    <Layout>
      <div style={{ padding: '20px', color: 'white', maxWidth: '1400px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>Stock Analysis</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Deep dive into market sentiment and price action.</p>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div style={{
            background: '#450a0a', border: '1px solid #7f1d1d',
            color: '#fca5a5', padding: '12px 20px',
            borderRadius: '10px', marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '20px' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '20px', border: '1px solid #1e293b' }}>

              {/* Ticker + Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '3rem', margin: 0 }}>{ticker}</h2>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
                    {loading ? 'Loading…' : stockData?.companyName ?? '—'}
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

                <div style={{ textAlign: 'right' }}>
                  {loading ? (
                    <div style={{ fontSize: '1.4rem', color: '#475569', marginTop: '10px' }}>
                      Fetching price…
                    </div>
                  ) : (
                    <>
                      {/* ✅ REAL PRICE for whatever ticker is in the URL */}
                      <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        {stockData?.currentPrice != null
                          ? `$${stockData.currentPrice.toFixed(2)}`
                          : 'N/A'}
                      </div>
                      {stockData?.movingAverage5Day != null && (
                        <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
                          5-Day MA:{' '}
                          <span style={{ color: '#38bdf8' }}>
                            ${stockData.movingAverage5Day.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Time filter buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((t) => (
                  <button
                    key={t}
                    style={{
                      background: t === '1D' ? '#38bdf8' : '#1e293b',
                      border: 'none', color: 'white',
                      padding: '8px 16px', borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: t === '1D' ? '700' : '400',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div style={{ height: '350px', marginTop: '30px', borderBottom: '1px solid #1e293b', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                  <path
                    d="M0,250 Q100,200 200,220 T400,150 T600,180 T800,50"
                    fill="none" stroke="#10b981" strokeWidth="4"
                  />
                  {([220, 150, 180, 50] as number[]).map((cy, i) => (
                    <circle key={i} cx={(i + 1) * 200} cy={cy} r="6" fill="#10b981" />
                  ))}
                </svg>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  color: '#475569', fontSize: '12px', marginTop: '8px'
                }}>
                  <span>9:30 AM</span><span>11:30 AM</span><span>1:00 PM</span><span>4:00 PM</span>
                </div>
              </div>
            </div>

            {/* ── METRICS ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 8px 0' }}>52-Week Range</p>
                {loading ? <p style={{ color: '#475569', margin: 0 }}>Loading…</p> : (
                  <>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 4px 0' }}>
                      {fmt(stockData?.fiftyTwoWeekLow ?? null)} – {fmt(stockData?.fiftyTwoWeekHigh ?? null)}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Low – High</p>
                  </>
                )}
              </div>

              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Volume</p>
                {loading ? <p style={{ color: '#475569', margin: 0 }}>Loading…</p> : (
                  <>
                    <h3 style={{ fontSize: '1.4rem', margin: '0 0 4px 0' }}>{fmtVolume(stockData?.volume ?? null)}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Avg. Daily</p>
                  </>
                )}
              </div>

              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Market Cap</p>
                {loading ? <p style={{ color: '#475569', margin: 0 }}>Loading…</p> : (
                  <>
                    <h3 style={{ fontSize: '1.4rem', margin: '0 0 4px 0' }}>{fmtMarketCap(stockData?.marketCap ?? null)}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Total Value</p>
                  </>
                )}
              </div>
            </div>

            {/* ── VOLATILITY BAR ── */}
            {!loading && stockData?.volatility != null && (
              <div style={{
                background: '#0f172a', padding: '20px', borderRadius: '15px',
                border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '20px'
              }}>
                <div style={{ minWidth: '140px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 4px 0' }}>5-Day Volatility</p>
                  <h3 style={{ fontSize: '1.6rem', margin: 0, color: stockData.volatility > 3 ? '#f87171' : '#10b981' }}>
                    {stockData.volatility.toFixed(2)}%
                  </h3>
                </div>
                <div style={{ flex: 1, height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(stockData.volatility * 10, 100)}%`,
                    background: stockData.volatility > 3 ? '#f87171' : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, minWidth: '80px', textAlign: 'right' }}>
                  {stockData.volatility > 3 ? '⚠️ High' : '✅ Normal'}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* HypeMeter — already works, passes ticker as prop */}
            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b' }}>
              <h3 style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 20px 0' }}>AI Hype Meter</h3>
              <HypeMeter symbol={ticker} />
            </div>

            {/* Recent News */}
            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 20px 0' }}>Recent News</h3>
              {[
                `${ticker} announces next-generation AI chips…`,
                `Why analysts remain bullish on ${ticker}…`,
                `Global tech spending forecasts increase for ${ticker}`,
              ].map((news, i) => (
                <div key={i} style={{
                  marginBottom: '20px', paddingBottom: '15px',
                  borderBottom: i < 2 ? '1px solid #1e293b' : 'none'
                }}>
                  <p style={{ fontSize: '0.95rem', margin: '0 0 5px 0', lineHeight: '1.4' }}>{news}</p>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Reuters • {i + 2}h ago</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}