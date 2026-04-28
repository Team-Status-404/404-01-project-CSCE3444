import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InfoTooltip from './InfoTooltip';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

interface TrendingStock {
  ticker: string;
  hype_score: number;
  tag: string;
  company_name: string;
  price: number;
}

export default function TrendingStocks() {
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stocks/trending?limit=5&sort=hype_desc`);
        const json = await response.json();

        if (response.ok && json.status === 'success') {
          setTrending(json.data);
        } else {
          setError(json.message || 'Failed to fetch trending stocks.');
        }
      } catch {
        setError('Network error while fetching trending stocks.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  const getHypeColor = (score: number) => {
    if (score >= 65) return '#4ade80';
    if (score <= 35) return '#ef4444';
    return '#fbbf24';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <article className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <h3 style={{ margin: 0 }}>Trending Stocks</h3>
            <InfoTooltip content={TOOLTIP_COPY.TRENDING_STOCKS || "Stocks with the highest social hype score."} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
            Loading trending data...
          </div>
        ) : error ? (
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
            {error}
          </div>
        ) : trending.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
            No trending data available in the last 24 hours.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trending.map((stock) => (
              <Link
                key={stock.ticker}
                to={`/stock/${stock.ticker.toLowerCase()}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #1e293b',
                  transition: 'border 0.2s, background 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.border = '1px solid #38bdf8';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.border = '1px solid #1e293b';
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                }}
              >
                {/* Ticker & Company */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{stock.ticker}</strong>
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {stock.company_name}
                  </span>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', marginRight: '20px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Price</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: '#f8fafc' }}>
                    ${stock.price ? stock.price.toFixed(2) : '---'}
                  </strong>
                </div>

                {/* Hype Score */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Hype</span>
                  <strong style={{ display: 'block', fontSize: '1.3rem', color: getHypeColor(stock.hype_score) }}>
                    {stock.hype_score}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/trending')}
            style={{
              background: 'transparent',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              padding: '8px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#38bdf8';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#38bdf8';
            }}
          >
            View Full Discovery Engine &rarr;
          </button>
        </div>
      </article>
    </div>
  );
}
