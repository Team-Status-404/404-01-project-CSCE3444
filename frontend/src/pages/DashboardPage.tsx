import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import StockCard from '../components/StockCard';
import { watchlist } from '../data/stocks';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// --- MOCK DATA ---
const trendData = [
  { day: 'Mon', price: 150, sentiment: 65 },
  { day: 'Tue', price: 152, sentiment: 70 },
  { day: 'Wed', price: 149, sentiment: 45 },
  { day: 'Thu', price: 155, sentiment: 80 },
  { day: 'Fri', price: 158, sentiment: 85 },
];

const sentimentLeaderboard = [
  { ticker: 'NVDA', score: 98, label: 'Extremely Bullish', color: '#4ade80' },
  { ticker: 'SMCI', score: 87, label: 'Bullish', color: '#4ade80' },
  { ticker: 'ARM', score: 76, label: 'Slightly Bullish', color: '#a3e635' },
  { ticker: 'TSLA', score: 42, label: 'Neutral / Mixed', color: '#fbbf24' },
  { ticker: 'AAPL', score: 28, label: 'Bearish', color: '#ef4444' },
];

const aiSignals = [
  { id: 1, asset: 'AAPL', signal: 'Unusual Options Activity', type: 'positive', time: '10m ago' },
  { id: 2, asset: 'TSLA', signal: 'Social Sentiment Drop', type: 'negative', time: '1h ago' },
  { id: 3, asset: 'NVDA', signal: 'Whale Accumulation', type: 'positive', time: '2h ago' },
];

export default function DashboardPage() {
  return (
    <Layout>
      <TopBar
        title="Market Intelligence"
        subtitle="Welcome back, user. Sentiment is 89% Bullish for your core watchlist."
      />

      {/* My Watchlist */}
      <section className="section-block" style={{ marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>My Watchlist</h3>
        <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {watchlist.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      </section>

      {/* Price vs Sentiment Trend Graph */}
      <section className="section-block" style={{ marginTop: '30px' }}>
        <article className="card" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Price vs. Sentiment Trend</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#38bdf8" domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#4ade80" domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                
                <Bar yAxisId="right" dataKey="sentiment" fill="#4ade80" opacity={0.3} radius={[4, 4, 0, 0]} name="Sentiment Score" />
                <Line yAxisId="left" type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} name="Avg Price" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Bottom Split: Leaderboard & AI Signals */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '30px' }}>
        
        {/* Left: Sentiment Leaderboard */}
        <article className="card" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Sentiment Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sentimentLeaderboard.map((item, index) => (
              <div key={item.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '1.2rem', width: '24px' }}>#{index + 1}</span>
                  <strong style={{ fontSize: '1.2rem' }}>{item.ticker}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: item.color, fontSize: '1.1rem', display: 'block' }}>{item.score}/100</strong>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Right: AI Signals */}
        <article className="card" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>AI Signals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aiSignals.map((signal) => (
              <div key={signal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{signal.asset}</strong>
                  <span style={{ fontSize: '0.9rem', color: signal.type === 'positive' ? '#4ade80' : '#ef4444' }}>
                    {signal.signal}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{signal.time}</span>
              </div>
            ))}
          </div>
        </article>

      </section>
    </Layout>
  );
}