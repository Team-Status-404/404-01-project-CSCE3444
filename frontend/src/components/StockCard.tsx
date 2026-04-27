import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import type { WatchlistStock } from '../data/stocks';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type StockCardProps = {
  stock: WatchlistStock;
};

export default function StockCard({ stock }: StockCardProps) {
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // UC-09: LIVE PRICE FLASH STATE (Jeel Patel - Sprint 3)
  // ==========================================
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // ==========================================
  // UC-09: Use the new fast /api/stocks/TICKER/price endpoint
  // instead of the heavy /api/stock/TICKER endpoint.
  // Then connect to SSE stream for continuous updates.
  // ==========================================
  useEffect(() => {
    // Initial fetch using the fast price-only endpoint
    fetch(`${API_BASE}/api/stocks/${stock.symbol}/price`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data.currentPrice != null) {
          const currentPrice = result.data.currentPrice;
          setPrice(`$${currentPrice.toFixed(2)}`);
          prevPriceRef.current = currentPrice;
        } else {
          setPrice('N/A');
        }
      })
      .catch(() => setPrice('Error'))
      .finally(() => setLoading(false));

    // SSE stream for live updates on this card
    const eventSource = new EventSource(`${API_BASE}/api/stocks/${stock.symbol}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === 'live' && data.currentPrice != null) {
          const newPrice = data.currentPrice;

          // Trigger green/red flash
          if (prevPriceRef.current !== null && newPrice !== prevPriceRef.current) {
            setPriceFlash(newPrice > prevPriceRef.current ? 'up' : 'down');
            setTimeout(() => setPriceFlash(null), 1000);
          }

          prevPriceRef.current = newPrice;
          setPrice(`$${newPrice.toFixed(2)}`);
          setLoading(false);
        } else if (data.status === 'stale' || data.status === 'error') {
          // Keep showing the last known price, don't overwrite
        }
      } catch (err) {
        console.error('StockCard SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      // SSE will auto-reconnect, just keep showing last known price
    };

    return () => {
      eventSource.close();
    };
  }, [stock.symbol]);

  const isUp = stock.trend === 'up';

  const getSentimentClass = (): string => {
    const s = stock.sentiment.toLowerCase();
    if (s.includes('positive') || s.includes('bullish')) return 'pill positive';
    if (s.includes('negative') || s.includes('bearish')) return 'pill negative';
    return 'pill neutral';
  };

  // UC-09: Flash color style for the price
  const getPriceColor = (): string => {
    if (priceFlash === 'up') return '#4ade80';
    if (priceFlash === 'down') return '#ef4444';
    return 'inherit';
  };

  return (
    <article className="card stock-card" style={{ transition: 'all 0.3s ease-in-out' }}>
      <div className="stock-card-header">
        <div>
          <h3>{stock.symbol}</h3>
          <p>{stock.company}</p>
        </div>
        <span className={getSentimentClass()}>{stock.sentiment}</span>
      </div>

      <div className="stock-card-body">
        <div>
          <strong style={{ color: getPriceColor(), transition: 'color 0.3s ease' }}>
            {loading ? 'Loading…' : price}
          </strong>
          <p className={isUp ? 'positive-text' : 'negative-text'}>{stock.change} today</p>
        </div>

        <Link to={`/stock/${stock.symbol}`} className="secondary-link">
          View Detail
        </Link>
      </div>
    </article>
  );
}