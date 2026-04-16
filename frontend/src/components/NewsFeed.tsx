import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Article {
  article_id: string;
  headline: string;
  source: string;
  published_at: string;
  url: string;
  sentiment_score: number;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const published = new Date(dateStr);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getSentimentColor(score: number): string {
  if (score >= 0.05) return '#4ade80';
  if (score <= -0.05) return '#f87171';
  return '#94a3b8';
}

function getSentimentLabel(score: number): string {
  if (score >= 0.05) return 'Positive';
  if (score <= -0.05) return 'Negative';
  return 'Neutral';
}

// ─── SKELETON LOADER ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderBottom: '1px solid #1e293b',
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ height: 14, borderRadius: 4, background: 'rgba(148,163,184,0.1)', width: '90%', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 14, borderRadius: 4, background: 'rgba(148,163,184,0.1)', width: '70%', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(148,163,184,0.07)', width: '40%', animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
interface NewsFeedProps {
  ticker: string;
}

export default function NewsFeed({ ticker }: NewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/stocks/${ticker}/news`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setArticles(data.articles);
        } else {
          setError(data.message || 'Could not load news.');
        }
      })
      .catch(() => setError('Network error — could not reach the server.'))
      .finally(() => setLoading(false));
  }, [ticker]);

  return (
    <article className="card info-card" style={{ flex: 1 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <h3 style={{ marginBottom: 20, margin: '0 0 20px 0' }}>Latest News</h3>

      {/* Loading State — skeleton cards */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171',
          fontSize: 14,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          No recent news found for {ticker}.
        </p>
      )}

      {/* News Cards */}
      {!loading && !error && articles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {articles.map((article, i) => {
            const isExpanded = expanded === article.article_id;
            const isLast = i === articles.length - 1;

            return (
              <div
                key={article.article_id}
                style={{
                  borderBottom: isLast ? 'none' : '1px solid #1e293b',
                  paddingBottom: isLast ? 0 : 16,
                }}
              >
                {/* Headline — truncated, expands on tap */}
                <p
                  onClick={() => setExpanded(isExpanded ? null : article.article_id)}
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: isExpanded ? 'visible' : 'hidden',
                  }}
                >
                  {article.headline}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>
                    {article.source} • {getRelativeTime(article.published_at)}
                  </span>

                  {/* Sentiment badge */}
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: getSentimentColor(article.sentiment_score),
                    background: `${getSentimentColor(article.sentiment_score)}18`,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: `1px solid ${getSentimentColor(article.sentiment_score)}40`,
                  }}>
                    {getSentimentLabel(article.sentiment_score)}
                  </span>

                  {/* Read more link */}
                  {article.url && article.url !== '#' && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#38bdf8', marginLeft: 'auto' }}
                     >
                        Read →
                     </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}