import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ChevronDown } from 'lucide-react';
import tickerData from '../data/tickers.json';

interface TickerEntry {
  symbol: string;
  name: string;
}

const ALL_TICKERS: TickerEntry[] = (tickerData as TickerEntry[]).sort((a, b) =>
  a.symbol.localeCompare(b.symbol)
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'search' | 'manual'>(
    () => (sessionStorage.getItem('inputMode') as 'search' | 'manual') || 'search'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<TickerEntry[]>(ALL_TICKERS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const navigate = useNavigate();
  const leftRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setResults(ALL_TICKERS);
    } else {
      const q = value.trim().toUpperCase();
      setResults(ALL_TICKERS.filter(t => t.symbol.startsWith(q)));
    }
    setShowDropdown(true);
  };

  const handleModeChange = (newMode: 'search' | 'manual') => {
    setMode(newMode);
    sessionStorage.setItem('inputMode', newMode);
    setSearchQuery('');
    setManualQuery('');
    setResults(ALL_TICKERS);
    if (newMode === 'search') {
      setShowDropdown(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setShowDropdown(false);
      setTimeout(() => manualInputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leftRef.current && !leftRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string, name: string) => {
    setSearchQuery(`${symbol} - ${name}`);
    setShowDropdown(false);
    navigate(`/stock/${symbol}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      navigate(`/stock/${manualQuery.trim().toUpperCase()}`);
      setManualQuery('');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#070f1d', color: 'white' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <header style={{
          height: '70px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          gap: '20px',
        }}>

          {/* ── LEFT ── */}
          <div ref={leftRef} style={{ flex: 1, position: 'relative' }}>

            {mode === 'search' ? (
              <>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  Search for a stock:
                </div>

                {/* ✅ wider input box */}
                <div style={{ position: 'relative', maxWidth: '900px' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search any ticker or company..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => {
                      setResults(
                        searchQuery.trim()
                          ? ALL_TICKERS.filter(t => t.symbol.startsWith(searchQuery.trim().toUpperCase()))
                          : ALL_TICKERS
                      );
                      setShowDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].symbol, results[0].name);
                      if (e.key === 'Escape') setShowDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 14px',
                      background: '#0f172a',
                      border: `1px solid ${showDropdown ? '#38bdf8' : '#334155'}`,
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <ChevronDown
                    size={14}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      searchInputRef.current?.focus();
                    }}
                  />
                </div>

                {/* ✅ wider dropdown */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    maxWidth: '900px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '5px 12px', color: '#475569', fontSize: '0.72rem', borderBottom: '1px solid #334155' }}>
                      {results.length} ticker{results.length !== 1 ? 's' : ''} {searchQuery.trim() ? 'found' : '— A to Z'}
                    </div>

                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      {results.length > 0 ? results.map((ticker, i) => (
                        <div
                          key={ticker.symbol}
                          onClick={() => handleSelect(ticker.symbol, ticker.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '9px 14px',
                            cursor: 'pointer',
                            borderBottom: i < results.length - 1 ? '1px solid #2d3f55' : 'none',
                            fontSize: '0.85rem',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{
                            background: '#1e3a5f',
                            color: '#38bdf8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            minWidth: '56px',
                            textAlign: 'center',
                            flexShrink: 0,
                          }}>
                            {ticker.symbol}
                          </span>
                          <span style={{ color: '#94a3b8' }}>{ticker.name}</span>
                        </div>
                      )) : (
                        <div style={{ padding: '16px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                          No matching tickers found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  Enter Ticker Symbol (e.g., AAPL, BTC-USD, ^GSPC):
                </div>
                <form onSubmit={handleManualSubmit}>
                  <input
                    ref={manualInputRef}
                    type="text"
                    placeholder="SPY"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value.toUpperCase())}
                    style={{
                      padding: '8px 14px',
                      background: '#0f172a',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                      width: '300px',
                      letterSpacing: '0.05em',
                    }}
                  />
                </form>
              </>
            )}
          </div>

          {/* ── RIGHT: radio buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Input Mode:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label
                onClick={() => handleModeChange('search')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: mode === 'search' ? 'white' : '#64748b' }}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${mode === 'search' ? '#ef4444' : '#475569'}`,
                  background: mode === 'search' ? '#ef4444' : 'transparent',
                  transition: 'all 0.2s', flexShrink: 0,
                }} />
                Search US Stocks
              </label>

              <label
                onClick={() => handleModeChange('manual')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: mode === 'manual' ? 'white' : '#64748b' }}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${mode === 'manual' ? '#ef4444' : '#475569'}`,
                  background: mode === 'manual' ? '#ef4444' : 'transparent',
                  transition: 'all 0.2s', flexShrink: 0,
                }} />
                Manual Entry
              </label>
            </div>
          </div>

        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>{children}</div>
      </main>
    </div>
  );
}