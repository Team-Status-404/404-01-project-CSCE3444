import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { WatchlistStock } from '../data/stocks';

const API_BASE = 'http://localhost:5000';

type StockCardProps = {
  stock: WatchlistStock;
};

export default function StockCard({ stock }: StockCardProps) {
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stock/${stock.symbol}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data.currentPrice != null) {
          setPrice(`$${result.data.currentPrice.toFixed(2)}`);
        } else {
          setPrice('N/A');
        }
      })
      .catch(() => setPrice('Error'))
      .finally(() => setLoading(false));
  }, [stock.symbol]);

  const isUp = stock.trend === 'up';

  return (
    <article className="card stock-card">
      <div className="stock-card-header">
        <div>
          <h3>{stock.symbol}</h3>
          <p>{stock.company}</p>
        </div>
        <span className={isUp ? 'pill positive' : 'pill negative'}>{stock.sentiment}</span>
      </div>

      <div className="stock-card-body">
        <div>
          <strong>{loading ? 'Loading…' : price}</strong>
          <p className={isUp ? 'positive-text' : 'negative-text'}>{stock.change} today</p>
        </div>

        <Link to={`/stock/${stock.symbol}`} className="secondary-link">
          View Detail
        </Link>
      </div>
    </article>
  );
}