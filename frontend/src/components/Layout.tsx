import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search } from 'lucide-react';
import tickerData from '../data/tickers.json';

interface TickerEntry {
  symbol: string;
  name: string;
}

const ALL_TICKERS: TickerEntry[] = (tickerData as TickerEntry[]).sort((a, b) =>
  a.symbol.localeCompare(b.symbol)
);

export default function Layout({ children }: { children: React.ReactNode }) {

  // ── LEFT: plain search bar ──
  const [leftQuery, setLeftQuery] = useState('');

  // ── RIGHT: mode ──
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<TickerEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const rightRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // LEFT plain Enter
  const handleLeftSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (leftQuery.trim()) {
      navigate(`/stock/${leftQuery.trim().toUpperCase()}`);
      setLeftQuery('');
    }
  };

  // Filter tickers as user types inside dropdown
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setResults(ALL_TICKERS);
    } else {
      const q = value.trim().toUpperCase();
      setResults(ALL_TICKERS.filter(t => t.symbol.startsWith(q)));
    }
  };

  // Click Search US Stocks radio
  const handleModeChange = (newMode: 'search' | 'manual') => {
    setMode(newMode);
    setSearchQuery('');
    if (newMode === 'search') {
      setResults(ALL_TICKERS);
      setShowDropdown(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rightRef.current && !rightRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/stock/${symbol}`);
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
              value={leftQuery}
              onChange={(e) => setLeftQuery(e.target.value)}
              style={{
                padding: '9px 16px 9px 38px',
                borderRadius: '20px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                width: '260px',
                outline: 'none',
                fontSize: '0.85rem',
              }}
            />
          </form>

          {/* ── RIGHT: just two radio buttons, dropdown appears below ── */}
          <div ref={rightRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* Radio: Search US Stocks */}
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

            {/* Radio: Manual Entry */}
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

            {/* Dropdown — appears below the radio buttons when Search US Stocks is selected */}
            {showDropdown && mode === 'search' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '420px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                zIndex: 1000,
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                overflow: 'hidden',
              }}>
                {/* Search input inside dropdown */}
                <div style={{ padding: '10px', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Type to filter tickers..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) handleSelect(searchQuery.trim().toUpperCase());
                        if (e.key === 'Escape') setShowDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 30px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Count label */}
                <div style={{ padding: '5px 12px', color: '#475569', fontSize: '0.72rem', borderBottom: '1px solid #334155' }}>
                  {results.length} ticker{results.length !== 1 ? 's' : ''} {searchQuery.trim() ? 'found' : '— A to Z'}
                </div>

                {/* Scrollable ticker list */}
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {results.length > 0 ? results.map((ticker, i) => (
                    <div
                      key={ticker.symbol}
                      onClick={() => handleSelect(ticker.symbol)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', cursor: 'pointer',
                        borderBottom: i < results.length - 1 ? '1px solid #2d3f55' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{
                        background: '#1e3a5f', color: '#38bdf8',
                        padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.76rem', fontWeight: '700',
                        minWidth: '56px', textAlign: 'center', flexShrink: 0,
                      }}>
                        {ticker.symbol}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>{ticker.name}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '16px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                      No matching tickers found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>{children}</div>
      </main>
    </div>
  );
}