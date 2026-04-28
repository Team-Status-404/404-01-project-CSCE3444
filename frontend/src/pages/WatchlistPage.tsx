import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import StockCard from '../components/StockCard';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type SortOption = 'hype_desc' | 'hype_asc' | 'price_desc' | 'price_asc';

type WatchlistEntry = {
  ticker: string;
  company_name: string;
  current_price: number;
  ma_5_day: number;
  hype_score: number;
  hype_tag: string;
  price_change_24h: number;
  price_change_pct_24h: number;
  total_return: number;
  divergence_warning_active: boolean;
  graph_data: {
    historical_prices: number[];
    historical_sentiment: number[];
  };
};

export default function WatchlistPage() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('hype_desc');

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/user/watchlist?user_id=${user.user_id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setWatchlist(data.watchlist);
        } else {
          setError(data.message || 'Failed to load watchlist.');
        }
      })
      .catch(() => setError('Network error — could not load watchlist.'))
      .finally(() => setLoading(false));
  }, [user]);

  const sorted = useMemo(() => {
    const copy = [...watchlist];
    switch (sort) {
      case 'hype_desc':
        return copy.sort((a, b) => b.hype_score - a.hype_score);
      case 'hype_asc':
        return copy.sort((a, b) => a.hype_score - b.hype_score);
      case 'price_desc':
        return copy.sort((a, b) => b.price_change_pct_24h - a.price_change_pct_24h);
      case 'price_asc':
        return copy.sort((a, b) => a.price_change_pct_24h - b.price_change_pct_24h);
      default:
        return copy;
    }
  }, [watchlist, sort]);

  return (
    <Layout>
      <TopBar
        title="My Watchlist"
        subtitle="Manage and track your custom stock portfolio."
        actionLabel="Add Stock"
        actionTo="/markets"
      />

      <section className="section-block">
        <div className="sort-control">
          <label htmlFor="sort-select" className="muted-label">Sort by</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            <option value="hype_desc">Highest Hype</option>
            <option value="hype_asc">Lowest Hype</option>
            <option value="price_desc">Top Gainers</option>
            <option value="price_asc">Top Losers</option>
          </select>
        </div>

        {loading && (
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
            Loading watchlist…
          </p>
        )}

        {!loading && error && (
          <p style={{ color: '#f87171', textAlign: 'center', marginTop: '40px' }}>{error}</p>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <p>Your watchlist is empty. Use "Add Stock" to start tracking stocks.</p>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="watchlist-grid">
            {sorted.map((entry) => (
              <StockCard
                key={entry.ticker}
                stock={{
                  symbol: entry.ticker,
                  company: entry.company_name,
                  price: `$${entry.current_price.toFixed(2)}`,
                  change: `${entry.price_change_pct_24h >= 0 ? '+' : ''}${entry.price_change_pct_24h.toFixed(2)}%`,
                  sentiment: `${entry.hype_score} ${entry.hype_tag}`,
                  trend: entry.price_change_pct_24h >= 0 ? 'up' : 'down',
                }}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
