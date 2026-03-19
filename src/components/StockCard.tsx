import { Link } from 'react-router-dom';
import type { WatchlistStock } from '../data/stocks';

type StockCardProps = {
  stock: WatchlistStock;
};

export default function StockCard({ stock }: StockCardProps) {
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
          <strong>{stock.price}</strong>
          <p className={isUp ? 'positive-text' : 'negative-text'}>{stock.change} today</p>
        </div>
        <Link to="/stock/nvda" className="secondary-link">
          View Detail
        </Link>
      </div>
    </article>
  );
}
