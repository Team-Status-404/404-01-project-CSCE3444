import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // This forces the app to go to whatever ticker you typed
      navigate(`/stock/${query.trim().toUpperCase()}`);
      setQuery('');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#070f1d', color: 'white' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 30px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search ANY ticker..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: '10px 40px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', width: '300px', outline: 'none' }}
            />
          </form>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>{children}</div>
      </main>
    </div>
  );
}