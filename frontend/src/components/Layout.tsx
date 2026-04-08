import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search } from 'lucide-react';
import tickerData from '../data/tickers.json';

interface TickerEntry {
  symbol: string;
  name: string;
}

const ALL_TICKERS: TickerEntry[] = tickerData as TickerEntry[];

export default function Layout({ children }: { children: React.ReactNode }) {

  // ── LEFT: plain search bar (same as yesterday) ──
  const [query, setQuery] = useState('');

  // ── RIGHT: radio mode ──
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [radioQuery, setRadioQuery] = useState('');
  const [results, setResults] = useState<TickerEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // LEFT search — plain Enter to navigate
  const handleLeftSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/stock/${query.trim().toUpperCase()}`);
      setQuery('');
    }
  };

  // RIGHT: filter from local JSON instantly as user types
  const handleRadioInput = (value: string) => {
    setRadioQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const q = value.trim().toUpperCase();
    // Show ALL tickers that start with the query (alphabetical)
    const filtered = ALL_TICKERS.filter(t => t.symbol.startsWith(q));
    setResults(filtered);
    setShowDropdown(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (newMode: 'search' | 'manual') => {
    setMode(newMode);
    setRadioQuery('');
    setManualQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleSelect = (symbol: string) => {
    setRadioQuery('');
    setResults([]);
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
        }}>

          {/* ── LEFT: plain search bar ── */}
          <form onSubmit={handleLeftSearch} style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search ANY ticker..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: '9px 16px 9px 38px',
                borderRadius: '20px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                width: '280px',
                outline: 'none',
                fontSize: '0.85rem',
              }}
            />
          </form>

          {/* ── RIGHT: radio buttons + input ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* Radio: Search US Stocks */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: mode === 'search' ? 'white' : '#64748b' }}>
              <div
                onClick={() => handleModeChange('search')}
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${mode === 'search' ? '#ef4444' : '#475569'}`,
                  background: mode === 'search' ? '#ef4444' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
              />
              <span onClick={() => handleModeChange('search')}>Search US Stocks</span>
            </label>

            {/* Radio: Manual Entry */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: mode === 'manual' ? 'white' : '#64748b' }}>
              <div
                onClick={() => handleModeChange('manual')}
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${mode === 'manual' ? '#ef4444' : '#475569'}`,
                  background: mode === 'manual' ? '#ef4444' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
              />
              <span onClick={() => handleModeChange('manual')}>Manual Entry</span>
            </label>

            {/* Divider */}
            <div style={{ width: '1px', height: '28px', background: '#1e293b' }} />

            {/* Input area */}
            {mode === 'search' ? (
              <div ref={wrapperRef} style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type="text"
                  placeholder="Type A, AA, AAPL..."
                  value={radioQuery}
                  onChange={(e) => handleRadioInput(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && radioQuery.trim()) handleSelect(radioQuery.trim().toUpperCase());
                    if (e.key === 'Escape') setShowDropdown(false);
                  }}
                  style={{
                    padding: '9px 16px 9px 36px',
                    borderRadius: '20px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    width: '220px',
                    outline: 'none',
                    fontSize: '0.85rem',
                  }}
                />

                {/* Scrollable dropdown — shows ALL matching tickers */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '400px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    {results.length > 0 ? (
                      <>
                        {/* Result count */}
                        <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', color: '#475569', fontSize: '0.75rem' }}>
                          {results.length} ticker{results.length !== 1 ? 's' : ''} found
                        </div>
                        {results.map((ticker, i) => (
                          <div
                            key={ticker.symbol}
                            onClick={() => handleSelect(ticker.symbol)}
                            style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', padding: '10px 16px', cursor: 'pointer',
                              borderBottom: i < results.length - 1 ? '1px solid #1e293b' : 'none',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                background: '#1e3a5f', color: '#38bdf8',
                                padding: '2px 8px', borderRadius: '6px',
                                fontSize: '0.78rem', fontWeight: '700',
                                minWidth: '50px', textAlign: 'center',
                              }}>
                                {ticker.symbol}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{ticker.name}</span>
                            </div>
                            <span style={{ color: '#475569', fontSize: '0.75rem' }}>→</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ padding: '16px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                        No matching tickers found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Manual Entry — no dropdown
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  placeholder="e.g. AAPL then press Enter..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value.toUpperCase())}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '20px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    width: '220px',
                    outline: 'none',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                />
              </form>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>{children}</div>
      </main>
    </div>
  );
}