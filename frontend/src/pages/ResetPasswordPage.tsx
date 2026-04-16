import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If there's no token in the URL, block the view
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-panel">
          <h2>Invalid Link</h2>
          <p>No reset token found. Please request a new password reset link.</p>
          <button onClick={() => navigate('/forgot-password')} className="primary-button">
            Go to Account Recovery
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation matching backend constraints
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (newPassword.length > 72) {
      return setError('Password must be at most 72 characters.');
    }
    if (!/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(newPassword)) {
      return setError('Password must contain at least one special character.');
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect back to login with a success message state
        navigate('/login', { state: { message: 'Password successfully changed. Please log in with your new password.' } });
      } else {
        setError(data.message || 'Failed to reset password. The token may be expired.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-copy">
          <h1>Set New Password</h1>
          <p>Please enter your new password below. Ensure it is at least 8 characters and includes a special character.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            New Password
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error" style={{ color: 'red' }}>{error}</p>}

          <button type="submit" className="primary-button full-width" disabled={loading}>
            {loading ? 'Saving...' : 'Confirm New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}