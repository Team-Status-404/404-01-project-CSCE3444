import { Link, useLocation } from 'react-router-dom';

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Markets', path: '/markets' },
  { label: 'Login', path: '/login' },
  { label: 'Profile', path: '/profile' }  
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-logo">SI</div>
        <div>
          <p className="brand-name">StockIQ</p>
          <p className="brand-subtitle">Fintech UI</p>
        </div>
      </div>

      <nav className="nav-list">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={isActive ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
