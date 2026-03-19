export type WatchlistStock = {
  symbol: string;
  company: string;
  price: string;
  change: string;
  sentiment: string;
  trend: 'up' | 'down';
};

export const watchlist: WatchlistStock[] = [
  { symbol: 'NVDA', company: 'NVIDIA Corp.', price: '$874.15', change: '+2.14%', sentiment: '84% Bullish', trend: 'up' },
  { symbol: 'AAPL', company: 'Apple Inc.', price: '$189.43', change: '+0.82%', sentiment: '72% Bullish', trend: 'up' },
  { symbol: 'TSLA', company: 'Tesla Inc.', price: '$172.60', change: '-1.37%', sentiment: '48% Mixed', trend: 'down' },
  { symbol: 'MSFT', company: 'Microsoft', price: '$421.11', change: '+1.03%', sentiment: '76% Bullish', trend: 'up' },
  { symbol: 'AMZN', company: 'Amazon', price: '$177.31', change: '+0.64%', sentiment: '69% Bullish', trend: 'up' },
  { symbol: 'META', company: 'Meta Platforms', price: '$498.25', change: '-0.55%', sentiment: '58% Neutral', trend: 'down' }
];

export const nvdaStats = [
  { label: 'Open', value: '$868.20' },
  { label: 'Day High', value: '$879.30' },
  { label: 'Day Low', value: '$861.44' },
  { label: '52W High', value: '$974.00' }
];

export const keyTakeaways = [
  'AI sentiment remains positive after strong demand for data center chips.',
  'Analyst outlook is still bullish, but short-term volatility is possible.',
  'Traders are watching earnings guidance and overall semiconductor momentum.'
];
