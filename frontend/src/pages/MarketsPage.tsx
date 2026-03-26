import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const mockChartData = [
  { time: '9:30 AM', SP500: 5050 },
  { time: '11:00 AM', SP500: 5080 },
  { time: '1:00 PM', SP500: 5065 },
  { time: '3:00 PM', SP500: 5090 },
  { time: '4:00 PM', SP500: 5104 },
];

const trendingStocks = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: '$924.79', change: '+2.48%', isUp: true },
  { ticker: 'SMCI', name: 'Super Micro', price: '$1,024.10', change: '+32.8%', isUp: true },
  { ticker: 'ARM', name: 'ARM Holdings', price: '$129.43', change: '+4.1%', isUp: true },
  { ticker: 'PLTR', name: 'Palantir', price: '$24.50', change: '+1.2%', isUp: true }
];

export default function MarketsPage() {
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
                <p className="muted-label" style={{ margin: 0 }}>Market Overview</p>
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

            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['dataMin - 20', 'dataMax + 20']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="SP500" stroke="#38bdf8" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN: Clickable Trending Stocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <article className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Trending Stocks</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {trendingStocks.map((stock) => (
                <Link 
                  key={stock.ticker} 
                  to={`/stock/nvda`} // Routes the user to the Detail Page when clicked
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
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>{stock.price}</strong>
                    <span className={stock.isUp ? 'positive-text' : 'negative-text'} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {stock.change}
                    </span>
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