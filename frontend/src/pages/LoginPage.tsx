import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

useEffect(() => {
  // Only redirect if they are ALREADY logged in when the page first loads
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // <-- The empty array stops it from firing after a new login

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isSignUp
        ? await register(username, email, password)
        : await login(email, password);

      if (result.status === 'success') {
        // Intercept new users and send them to onboarding
        if (isSignUp) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Something went wrong');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);

    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.status === 'success') {
        
        // logic for google users to route to onboarding page if they are new
        if (result.is_new_user) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
        
      } else {
        setError(result.message || 'Google sign-in failed');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-copy">
          <h1>StockIQ AI Market Dashboard</h1>
          <p>
            Track stocks, monitor sentiment, and get AI-powered insights all in one place.
            Sign in to access your personalized watchlist and alerts.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              Username
              <input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="student@unt.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-button full-width" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="filled_black"
              size="large"
              width="100%"
              text={isSignUp ? 'signup_with' : 'signin_with'}
            />
          </div>

          <p className="form-note">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="toggle-auth-btn"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}