import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import StockCard from '../components/StockCard';
import { watchlist } from '../data/stocks';

export default function DashboardPage() {
  return (
    <Layout>
      <TopBar
        title="Dashboard"
        subtitle="Market overview, watchlist activity, and AI sentiment summary."
        actionLabel="Open NVDA Detail"
        actionTo="/stock/nvda"
      />

      <section className="stats-grid">
        <article className="card stat-card">
          <p>Portfolio Value</p>
          <strong>$58,420</strong>
          <span className="positive-text">+3.4% this week</span>
        </article>
        <article className="card stat-card">
          <p>AI Market Signal</p>
          <strong>Moderately Bullish</strong>
          <span>Confidence score: 81%</span>
        </article>
        <article className="card stat-card">
          <p>Tracked Assets</p>
          <strong>12</strong>
          <span>6 gainers, 4 mixed, 2 lagging</span>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>My Watchlist</h2>
            <p>Responsive card layout translated into React components.</p>
          </div>
        </div>

        <div className="watchlist-grid">
          {watchlist.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
