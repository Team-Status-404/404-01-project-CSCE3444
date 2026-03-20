import type { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, User } from 'lucide-react'; // Added icons for the top nav

type LayoutProps = PropsWithChildren;

export default function Layout({ children }: LayoutProps) {
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
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search stocks, news..." 
              style={{ 
                padding: '10px 10px 10px 40px', 
                borderRadius: '20px', 
                border: '1px solid rgba(148, 163, 184, 0.24)', 
                backgroundColor: 'rgba(10, 18, 34, 0.4)', 
                color: 'white', 
                width: '300px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Notifications & Profile */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: '#94a3b8' }}>
            <Bell size={20} style={{ cursor: 'pointer' }} />
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