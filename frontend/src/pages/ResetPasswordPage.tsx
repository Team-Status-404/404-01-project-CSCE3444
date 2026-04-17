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

  // --- REAL-TIME VALIDATION CHECKS ---
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 72;
  const hasSpecialChar = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  
  // The form is only valid if all three conditions are true
  const isFormValid = hasMinLength && hasSpecialChar && passwordsMatch;

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

    // Backup client-side validation just in case they bypass the disabled button
    if (!isFormValid) {
      return setError('Please ensure all password requirements are met.');
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

          {/* DYNAMIC CHECKLIST FOR NEW PASSWORD */}
          <ul style={{ fontSize: '0.85rem', paddingLeft: '20px', marginTop: '-10px', marginBottom: '15px', listStyleType: 'none', marginLeft: '0' }}>
            <li style={{ color: hasMinLength ? 'green' : '#888' }}>
              {hasMinLength ? '✓' : '○'} 8-72 characters
            </li>
            <li style={{ color: hasSpecialChar ? 'green' : '#888' }}>
              {hasSpecialChar ? '✓' : '○'} At least 1 special character
            </li>
          </ul>

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

          {/* DYNAMIC MATCH INDICATOR */}
          {/* Only show this text if they have actually started typing in the confirm box */}
          {confirmPassword.length > 0 && (
            <div style={{ fontSize: '0.85rem', marginTop: '-10px', marginBottom: '15px', color: passwordsMatch ? 'green' : 'red' }}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}

          {error && <p className="form-error" style={{ color: 'red' }}>{error}</p>}

          {/* BUTTON IS DISABLED UNTIL ALL CHECKS PASS */}
          <button 
            type="submit" 
            className="primary-button full-width" 
            disabled={loading || !isFormValid}
            style={{ opacity: (!isFormValid || loading) ? 0.6 : 1, cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Saving...' : 'Confirm New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}