import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import HypeMeter from '../components/HypeMeter';

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const ticker = symbol?.toUpperCase() || 'NVDA';

  return (
    <Layout>
      <div style={{ padding: '20px', color: 'white', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* --- HEADER --- */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>Stock Analysis</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Deep dive into market sentiment and price action.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '20px' }}>
          
          {/* --- LEFT SIDE: PRICE & CHART --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '20px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '3rem', margin: 0 }}>{ticker}</h2>
                  <p style={{ color: '#94a3b8', margin: 0 }}>{ticker} Corporation</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>$924.79</div>
                  <div style={{ color: '#10b981', fontSize: '1.2rem' }}>+2.48% (+$22.41)</div>
                </div>
              </div>

              {/* Time Filters */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((t) => (
                  <button key={t} style={{ background: t === '1D' ? '#38bdf8' : '#1e293b', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* CHART VISUALIZATION (Matches your green line screenshot) */}
              <div style={{ height: '350px', marginTop: '30px', borderBottom: '1px solid #1e293b', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                  <path d="M0,250 Q100,200 200,220 T400,150 T600,180 T800,50" fill="none" stroke="#10b981" strokeWidth="4" />
                  <circle cx="200" cy="220" r="6" fill="#10b981" />
                  <circle cx="400" cy="150" r="6" fill="#10b981" />
                  <circle cx="600" cy="180" r="6" fill="#10b981" />
                  <circle cx="800" cy="50" r="6" fill="#10b981" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '12px', marginTop: '10px' }}>
                  <span>9:30 AM</span><span>11:30 AM</span><span>1:00 PM</span><span>4:00 PM</span>
                </div>
              </div>
            </div>

            {/* --- METRICS ROW --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Social Volume</p>
                <h3 style={{ fontSize: '1.4rem', margin: '5px 0' }}>Extremely High</h3>
                <p style={{ color: '#10b981', fontSize: '0.8rem', margin: 0 }}>Trending #1 on X</p>
              </div>
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Retail Sentiment</p>
                <h3 style={{ fontSize: '1.4rem', margin: '5px 0' }}>78% Bullish</h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Based on Reddit/WSB</p>
              </div>
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Whale Alerts</p>
                <h3 style={{ fontSize: '1.4rem', margin: '5px 0' }}>3 Active</h3>
                <p style={{ color: '#10b981', fontSize: '0.8rem', margin: 0 }}>Large call volume detected</p>
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: HYPE & NEWS --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b' }}>
              <h3 style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '20px' }}>AI Hype Meter</h3>
              <HypeMeter symbol={ticker} />
            </div>

            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Recent News</h3>
              {[
                `${ticker} announces next-generation AI chips...`,
                `Why analysts remain bullish on ${ticker}...`,
                `Global tech spending forecasts increase for ${ticker}`
              ].map((news, i) => (
                <div key={i} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #1e293b' }}>
                  <p style={{ fontSize: '0.95rem', margin: '0 0 5px 0', lineHeight: '1.4' }}>{news}</p>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Reuters • {i+2}h ago</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}