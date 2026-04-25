import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const links = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Markets', path: '/markets' },
    ...(isAuthenticated
      ? [{ label: 'Profile', path: '/profile' }]
      : [{ label: 'Login', path: '/login' }]),
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <img src="/logo.png" alt="StockIq Logo" style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
        <div>
          <span className="brand-name">StockIQ</span>
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

        {isAuthenticated && (
          <button className="nav-link logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        )}
      </nav>

      {isAuthenticated && user && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <span>{user.username}</span>
        </div>
      )}
    </aside>
  );
}
