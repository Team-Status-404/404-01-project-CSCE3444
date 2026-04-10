import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// A starter list of popular stocks for the onboarding grid
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMD', name: 'Adv. Micro Devices' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'SMCI', name: 'Super Micro Comp.' },
];

export default function OnboardingPage() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  const { user } = useAuth(); // Grab the user from context

  const toggleStock = (symbol: string) => {
    
    setError(''); 
    
    if (selectedStocks.includes(symbol)) {
      setSelectedStocks(selectedStocks.filter(s => s !== symbol));
    } else {
      if (selectedStocks.length >= 5) {
        setError('Limit reached. You can only track a maximum of 5 stocks.');
        return;
      }
      setSelectedStocks([...selectedStocks, symbol]);
    }
  };

  const handleSave = async () => {
    if (selectedStocks.length === 0) {
      setError('Please select at least one stock to track.');
      return;
    }

    if (!user) {
      setError('User session not found. Please log in again.');
      return;
    }

    setIsSaving(true);
    
    // An array to keep track of any stocks that fail to save
    const failedStocks: string[] = [];
    
    try {
      for (const ticker of selectedStocks) {
        const res = await fetch(`http://localhost:5000/api/watchlist/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` 
          },
          body: JSON.stringify({ 
            user_id: user.user_id, 
            ticker: ticker 
          })
        });

        const data = await res.json();
        
        if (data.status === 'error') {
          console.warn(`Failed to add ${ticker}:`, data.message);
          // logs ticker that failed to save and keep going
          failedStocks.push(ticker);
        }
      }
      
      // Checks if there were any tickers that failed to save
      if (failedStocks.length > 0) {
        // Show the user which ones failed
        setError(`Saved partially. Failed to add: ${failedStocks.join(', ')}. Taking you to the dashboard...`);
        
        // Delay the redirect by 3 seconds so the user has time to read the message
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        // If no ticker being saved to dashboard failed, redirect instantly.
        navigate('/dashboard');
      }
      
    } catch (err) {
      // This catch block only triggers if the network completely fails or the backend crashes
      console.error('Error:', err);
      setError('A network error occurred. Please check your connection.');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '650px', width: '100%', backgroundColor: '#1e293b', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>
        <h1 style={{ marginTop: 0, marginBottom: '10px' }}>Build Your Watchlist</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px', lineHeight: '1.5' }}>
          Select up to 5 stocks to populate your main dashboard. You can easily track real-time prices, historical sentiment, and AI divergence warnings.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: selectedStocks.length === 5 ? '#4ade80' : '#f8fafc' }}>
            Selected: {selectedStocks.length} / 5
          </span>
          {error && <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</span>}
        </div>

        {/* The "Select 5 Stocks" Grid UI */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' }}>
          {POPULAR_STOCKS.map((stock) => {
            const isSelected = selectedStocks.includes(stock.symbol);
            return (
              <button
                key={stock.symbol}
                onClick={() => toggleStock(stock.symbol)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '24px',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : '#0f172a',
                  color: isSelected ? '#38bdf8' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <strong style={{ fontSize: '1.1rem' }}>{stock.symbol}</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{stock.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'opacity 0.2s ease'
          }}
        >
          {isSaving ? 'Saving...' : 'Save & Continue to Dashboard'}
        </button>

        {/* Skip Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: 'none',
            marginTop: '10px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}