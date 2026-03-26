import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import HypeMeter from '../components/HypeMeter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock intraday data for NVDA
const nvdaChartData = [
  { time: '9:30 AM', price: 902.50 },
  { time: '10:30 AM', price: 915.20 },
  { time: '11:30 AM', price: 910.80 },
  { time: '1:00 PM', price: 920.10 },
  { time: '2:30 PM', price: 918.45 },
  { time: '4:00 PM', price: 924.79 },
];

export default function StockDetailPage() {
  return (
    <Layout>
      <TopBar
        title="Stock Analysis"
        subtitle="Deep dive into market sentiment and price action."
        actionLabel="Add to Watchlist"
        actionTo="#"
      />

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', padding: '0 24px' }}>
        
        {/* ========================================== */}
        {/* LEFT COLUMN: Chart & Lower Metrics         */}
        {/* ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <article className="card hero-card" style={{ padding: '24px' }}>
            {/* Header: NVDA Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', margin: 0 }}>NVDA</h2>
                <p className="muted-label" style={{ margin: 0 }}>NVIDIA Corporation</p>
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

            {/* The New Recharts Interactive Graph */}
            <div style={{ height: '350px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nvdaChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                    itemStyle={{ color: '#4ade80' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#4ade80" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
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
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>Nvidia announces next-generation Blackwell AI chips, expanding datacenter dominance.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Reuters • 2h ago</span>
              </div>
              <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', lineHeight: '1.4' }}>Why Wall Street analysts remain ultra-bullish on NVDA despite record highs.</p>
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