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
  }, [ticker]);

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
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* HypeMeter */}
            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b' }}>
              <h3 style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 20px 0' }}>AI Hype Meter</h3>
              <HypeMeter />
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