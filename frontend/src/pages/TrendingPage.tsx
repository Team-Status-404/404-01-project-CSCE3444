import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';

interface DiscoveryStock {
  ticker: string;
  hype_score: number;
  company_name: string;
  tag: string;
  price: number;
}

export default function TrendingPage() {
  const [stocks, setStocks] = useState<DiscoveryStock[]>([]);
  const [sortBy, setSortBy] = useState('hype_desc');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDiscovery = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stocks/trending?limit=50&sort=${sortBy}`);
        const json = await res.json();
        if (json.status === 'success') setStocks(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiscovery();
  }, [sortBy]);

  return (
    <Layout>
      <TopBar title="Discovery Engine" subtitle="Real-time sentiment analysis across the US Market." />
      
      <div className="discovery-container">
        
        {/* Page Header & Controls */}
        <div className="topbar">
          <div>
            <h1 className="discovery-header-text">Market Opportunities</h1>
            <p className="muted-label">Showing the top 50 social movers based on your filters.</p>
          </div>

          <div className="discovery-controls">
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', paddingLeft: '8px' }}>
              Sort By
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: '#0f172a', color: '#38bdf8', fontWeight: 'bold',
                border: '1px solid #334155', borderRadius: '8px', padding: '8px 16px',
                outline: 'none', cursor: 'pointer', minWidth: '160px'
              }}
            >
              <option value="hype_desc">Highest Hype</option>
              <option value="hype_asc">Lowest Hype</option>
              <option value="volume_desc">Social Volume</option>
              <option value="ticker_asc">Symbol (A-Z)</option>
            </select>
          </div>
        </div>

        {/* List Header (Hidden on Mobile) */}
        <div className="discovery-table-header">
          <div>Asset</div>
          <div style={{ textAlign: 'center' }}>AI Hype Score</div>
          <div style={{ textAlign: 'center' }}>Sentiment</div>
          <div style={{ textAlign: 'right' }}>Price</div>
        </div>

        {/* Discovery List */}
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Scanning market sentiment...</div>
          ) : stocks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No market data currently available.
            </div>
          ) : (
            stocks.map((stock) => {
              const isHot = stock.hype_score >= 65;
              const isCold = stock.hype_score <= 35;
              
              const colorHex = isHot ? '#4ade80' : isCold ? '#fb7185' : '#fbbf24';
              const bgFillHex = isHot ? '#34d399' : isCold ? '#f43f5e' : '#f59e0b';
              const glowBoxShadow = isHot ? '0 0 12px rgba(52,211,153,0.4)' : isCold ? '0 0 12px rgba(251,113,133,0.4)' : '0 0 12px rgba(251,191,36,0.4)';

              return (
                <div key={stock.ticker} onClick={() => navigate(`/stock/${stock.ticker}`)} className="discovery-card">
                  
                  {/* Ticker & Company */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f8fafc', marginBottom: '4px' }}>
                      {stock.ticker}
                    </span>
                    <span className="muted-label" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stock.company_name}
                    </span>
                  </div>

                  {/* AI Hype Score Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '200px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: colorHex }}>{stock.hype_score}</span>
                    </div>
                    <div className="hype-bar-container">
                      <div className="hype-bar-fill" style={{ background: bgFillHex, width: `${stock.hype_score}%`, boxShadow: glowBoxShadow }}></div>
                    </div>
                  </div>

                  {/* Sentiment Pill */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase',
                      background: stock.tag === 'Positive' ? 'rgba(16, 185, 129, 0.1)' : stock.tag === 'Negative' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: stock.tag === 'Positive' ? '#34d399' : stock.tag === 'Negative' ? '#fb7185' : '#cbd5e1',
                      border: `1px solid ${stock.tag === 'Positive' ? 'rgba(16, 185, 129, 0.3)' : stock.tag === 'Negative' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                    }}>
                      {stock.tag === 'Positive' ? '▲ ' : stock.tag === 'Negative' ? '▼ ' : '● '}{stock.tag}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mobile-price-label" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>PRICE</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#e2e8f0', fontWeight: 500 }}>
                      ${stock.price ? stock.price.toFixed(2) : '---'}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}