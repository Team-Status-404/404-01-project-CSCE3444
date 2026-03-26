import Layout from '../components/Layout';
import TopBar from '../components/TopBar';

export default function WatchlistPage() {
  return (
    <Layout>
      <TopBar
        title="My Watchlist"
        subtitle="Manage and track your custom stock portfolio."
        actionLabel="Add Stock"
        actionTo="/search" 
      />

      <section className="section-block">
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
           <p>[ Watchlist Data Table Component Will Go Here ]</p>
        </div>
      </section>
    </Layout>
  );
}