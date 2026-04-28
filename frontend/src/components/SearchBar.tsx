import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

interface SearchResult {
  ticker: string;
  companyName: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
// Use a ref to store the timeout ID for debouncing
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle clicking outside the search bar to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // If input is empty, clear everything and hide dropdown immediately
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    // Show dropdown (with loading state) and clear previous errors
    setShowDropdown(true);
    setIsLoading(true);
    setError(null);

    // --- DEBOUNCE LOGIC (300ms) ---
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stocks/search?query=${value}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setResults(data.results);
        } else {
          setError('Failed to fetch results.');
          setResults([]);
        }
      } catch (err) {
        console.error(err); // show error in terminal
        setError('Network error.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (ticker: string) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    navigate(`/stock/${ticker}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '900px', maxWidth: '100%' }}>
    <div ref={searchContainerRef} style={{ position: 'relative', flex: 1 }}>
      
      {/* Search Input */}
      <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
      <input
        type="text"
        aria-label="Search stocks, news"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (query.trim()) setShowDropdown(true); }}

        // Allows "Manual Entry" by pressing Enter
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) {
            setShowDropdown(false);
            navigate(`/stock/${query.trim().toUpperCase()}`);
            setQuery(''); // clear the bar
          }
        }}

        placeholder="Search any ticker or company..." 
        style={{ 
          padding: '10px 10px 10px 40px', 
          borderRadius: '20px', 
          border: '1px solid rgba(148, 163, 184, 0.24)', 
          backgroundColor: 'rgba(10, 18, 34, 0.4)', 
          color: 'white', 
          width: '100%',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      />

      {/* Dynamic Dropdown UI */}
      {showDropdown && query.trim() && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '100%',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {isLoading ? (
            <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
              Searching...
            </div>
          ) : error ? (
            <div style={{ padding: '12px', color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div 
                key={item.ticker}
                onClick={() => handleSelect(item.ticker)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #334155',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {item.ticker}
                </span>
                <span style={{ color: '#f8fafc', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.companyName}
                </span>
              </div>
            ))
          ) : (
            // Alternate Flow 2a: No matching tickers found
            <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
              No matching tickers found.
            </div>
          )}
        </div>
      )}
    </div>
    <InfoTooltip content={TOOLTIP_COPY.SEARCH_BAR} />
  </div>
  );
}