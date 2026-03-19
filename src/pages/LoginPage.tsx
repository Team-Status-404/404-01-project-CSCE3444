import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-copy">
          <span className="eyebrow">Sprint 1 Frontend</span>
          <h1>StockIQ AI Market Dashboard</h1>
          <p>
            A simple login screen for the StockIQ fintech app. This page was built in React and styled
            to match the project mockup with a clean student-friendly structure.
          </p>
        </div>

        <form className="login-form">
          <label>
            Email
            <input type="email" placeholder="student@unt.edu" />
          </label>

          <label>
            Password
            <input type="password" placeholder="Enter password" />
          </label>

          <button type="button" className="primary-button full-width">
            Sign In
          </button>

          <p className="form-note">Demo only for UI submission. No backend authentication is connected.</p>
        </form>

        <div className="login-footer">
          <Link to="/dashboard" className="secondary-link">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
