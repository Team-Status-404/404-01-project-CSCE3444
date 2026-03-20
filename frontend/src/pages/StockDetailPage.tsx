import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import { keyTakeaways, nvdaStats } from '../data/stocks';
import HypeMeter from '../components/HypeMeter';

export default function StockDetailPage() {
  return (
    <Layout>
      <TopBar
        title="NVDA Stock Detail"
        subtitle="A focused detail page for a single stock, matching the sprint requirement."
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />

      <section className="detail-grid">
        <article className="card hero-card">
          <div className="hero-header">
            <div>
              <p className="muted-label">Ticker</p>
              <h2>NVDA</h2>
              <p>NVIDIA Corporation</p>
            </div>
            <div className="price-block">
              <strong>$874.15</strong>
              <span className="positive-text">+2.14% today</span>
            </div>
          </div>

          <div className="chart-placeholder">
            <div className="chart-line"></div>
            <div className="chart-line short"></div>
            <div className="chart-line medium"></div>
          </div>

          <p className="card-note">
            Chart area is a static UI placeholder for Sprint 1. Live pricing and graph data can be added
            in a later sprint.
          </p>
        </article>

        <article className="card info-card">
          <h3>Quick Stats</h3>
          <div className="stats-list">
            {nvdaStats.map((item) => (
              <div key={item.label} className="stats-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>AI Summary</h2>
            <p>Short takeaways displayed in a clean card layout.</p>
          </div>
        </div>

        <div className="summary-grid">
          {keyTakeaways.map((item) => (
            <article className="card summary-card" key={item}>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
