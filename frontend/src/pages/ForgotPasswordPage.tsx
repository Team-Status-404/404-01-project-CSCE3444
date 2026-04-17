import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Check your email for the reset link.');
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-copy">
          <h1>Account Recovery</h1>
          <p>Enter your email address and we'll send you a link to securely reset your password.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
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

          {error && <p className="form-error" style={{ color: 'red' }}>{error}</p>}
          {message && <p className="form-success" style={{ color: 'green' }}>{message}</p>}

          <button type="submit" className="primary-button full-width" disabled={loading}>
            {loading ? 'Sending...' : 'Request Reset Link'}
          </button>

          <p className="form-note" style={{ marginTop: '20px', textAlign: 'center' }}>
            Remembered your password? <Link to="/login">Back to Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}