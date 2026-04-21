import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import { Bell, User } from 'lucide-react'; 

type LayoutProps = PropsWithChildren;

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* --- GLOBAL TOP NAVIGATION BAR --- */}
        <header style={{ 
          height: '70px', 
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 30px',
          flexShrink: 0
        }}>
          
          {/* Search Bar Placed here */}
          <div data-tour="search-bar" style={{ flex: 1 }}>
            <SearchBar />
          </div>

          {/* Notifications & Profile */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: '#94a3b8' }}>
            <Bell data-tour="alerts-bell" size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/alerts')} />
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: '#38bdf8', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#07162f',
              cursor: 'pointer'
            }}>
              <User size={18} />
            </div>
          </div>
        </header>

        {/* --- PAGE CONTENT --- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
          {children}
        </div>
        
      </main>
    </div>
  );
}