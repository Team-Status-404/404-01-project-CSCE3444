import { useState } from "react";
import Layout from "../components/Layout";
import TopBar from "../components/TopBar";
import InfoTooltip from "../components/InfoTooltip";
import { TOOLTIP_COPY } from "../constants/tooltipCopy";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProfilePage() {
  const [userData] = useState(() => JSON.parse(localStorage.getItem("stockiq_user") || "{}"));
  const USER_ID = userData.user_id;
  const token = userData.token;
  const isOAuth = !!userData.is_oauth;

  const [fullName, setFullName] = useState<string>(userData.username ?? "");
  const [email, setEmail] = useState<string>(userData.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailChangeConfirmed, setEmailChangeConfirmed] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "deleted">("confirm");
  const [deleteError, setDeleteError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/;

  function validatePassword(pw: string): string | null {
    if (pw.length < 6) return "Password must be at least 6 characters.";
    if (pw.length > 10) return "Password must be at most 10 characters.";
    if (!SPECIAL_CHAR_RE.test(pw)) return "Password must contain at least one special character (e.g. !@#$%).";
    return null;
  }

  const passwordValidationError = password ? validatePassword(password) : null;
  const passwordsMatch = !password || password === confirmPassword;

  const emailChanged = !isOAuth && email !== userData.email;

  function clearMessages() {
    setErrorMessage("");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    clearMessages();

    if (emailChanged && !emailChangeConfirmed) {
      setErrorMessage("Please check the confirmation box to confirm your email change.");
      return;
    }

    if (password) {
      const pwErr = validatePassword(password);
      if (pwErr) { setErrorMessage(pwErr); return; }
      if (password !== confirmPassword) { setErrorMessage("Passwords do not match."); return; }
      // Ask for confirmation before changing password
      setShowPasswordModal(true);
      return;
    }

    await submitSave(false);
  }

  async function submitSave(withPassword: boolean) {
    clearMessages();
    try {
      const body: Record<string, string> = {};
      if (fullName !== userData.username) body.username = fullName;
      if (!isOAuth && email !== userData.email) body.email = email;
      if (withPassword) body.password = password;

      if (Object.keys(body).length === 0) {
        setErrorMessage("No changes to save.");
        return;
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        const updated = {
          ...userData,
          username: fullName,
          email: isOAuth ? userData.email : email,
        };
        localStorage.setItem("stockiq_user", JSON.stringify(updated));
        window.alert("Profile updated successfully!");
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to save profile.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile.");
    }
  }

  async function handleDeleteConfirm() {
    setDeleteError("");
    try {
      const response = await fetch(`${API_URL}/api/user/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: USER_ID }),
      });
      const data = await response.json();
      if (response.ok) {
        setDeleteStep("deleted");
      } else {
        throw new Error(data.message || "Failed to delete account.");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
    }
  }

  function handleDeleteModalClose() {
    if (deleteStep === "deleted") {
      localStorage.clear();
      window.location.href = "/login";
    } else {
      setShowDeleteModal(false);
    }
  }

  function openDeleteModal() {
    setDeleteStep("confirm");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  return (
    <Layout>
      <TopBar
        title="Profile Management"
        subtitle="Update user profile settings for the StockIQ dashboard."
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />

      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--color-surface, #1e1e2e)",
              border: "1px solid var(--color-border, #333)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
          >
            {deleteStep === "confirm" ? (
              <>
                <h3 style={{ marginBottom: "0.75rem" }}>Delete Account</h3>
                <p style={{ marginBottom: "1.25rem", color: "var(--color-muted, #aaa)" }}>
                  Are you sure you want to permanently delete your account? This cannot be undone.
                </p>
                {deleteError && (
                  <p className="negative-text" style={{ marginBottom: "0.75rem" }}>
                    {deleteError}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    style={{
                      background: "var(--color-negative, #dc2626)",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Yes, Delete My Account
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteModalClose}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--color-border, #555)",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✓</div>
                <h3 style={{ marginBottom: "0.75rem" }}>Account Deleted</h3>
                <p style={{ marginBottom: "1.25rem", color: "var(--color-muted, #aaa)" }}>
                  Your account has been successfully deleted. You will be redirected to the login page.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteModalClose}
                  className="primary-button"
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--color-surface, #1e1e2e)",
              border: "1px solid var(--color-border, #333)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "0.75rem" }}>Change Password</h3>
            <p style={{ marginBottom: "1.25rem", color: "var(--color-muted, #aaa)" }}>
              Are you sure you want to change your password? You will use the new password on your next login.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => { setShowPasswordModal(false); submitSave(true); }}
              >
                Yes, Change Password
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border, #555)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="form-layout">
        <article className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>Edit Profile</h2>
            <InfoTooltip content={TOOLTIP_COPY.PROFILE_USERNAME} />
          </div>
          <form className="settings-form" onSubmit={handleSave}>
            <label>
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearMessages(); }}
              />
            </label>
            <label>
              Email
              {isOAuth ? (
                <>
                  <input type="email" value={email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  <small style={{ color: "var(--color-muted, #aaa)" }}>
                    Email cannot be changed for Google-linked accounts.
                  </small>
                </>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages(); setEmailChangeConfirmed(false); }}
                />
              )}
            </label>
            {emailChanged && (
              <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={emailChangeConfirmed}
                  onChange={(e) => setEmailChangeConfirmed(e.target.checked)}
                  style={{ width: "auto" }}
                />
                <span style={{ fontSize: "0.875rem", color: "var(--color-muted, #aaa)" }}>
                  I understand changing my email will update my login credentials.
                </span>
              </label>
            )}
            <label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>New Password</span>
                <InfoTooltip content={TOOLTIP_COPY.PROFILE_PASSWORD} />
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={password}
                  placeholder="Leave blank to keep current password"
                  onChange={(e) => { setPassword(e.target.value); clearMessages(); setConfirmPassword(""); if (!e.target.value) { setShowNewPassword(false); setShowConfirmPassword(false); } }}
                  style={{ paddingRight: "2.5rem", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "0.6rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--color-muted, #aaa)",
                    lineHeight: 1,
                    fontSize: "1.1rem",
                  }}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>
            {password && (
              <small style={{ color: passwordValidationError ? "var(--color-negative, #dc2626)" : "var(--color-muted, #aaa)", marginTop: "-0.5rem" }}>
                {passwordValidationError ?? "Looks good — 6–10 chars with a special character."}
              </small>
            )}
            <label>
              Confirm New Password
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="Re-enter new password"
                  disabled={!password || !!passwordValidationError}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearMessages(); }}
                  style={{
                    paddingRight: "2.5rem",
                    width: "100%",
                    ...(!password || !!passwordValidationError ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={!password || !!passwordValidationError}
                  style={{
                    position: "absolute",
                    right: "0.6rem",
                    background: "none",
                    border: "none",
                    cursor: !password || !!passwordValidationError ? "not-allowed" : "pointer",
                    padding: 0,
                    color: "var(--color-muted, #aaa)",
                    lineHeight: 1,
                    fontSize: "1.1rem",
                    opacity: !password || !!passwordValidationError ? 0.4 : 1,
                  }}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>
            {password && confirmPassword && !passwordsMatch && (
              <small style={{ color: "var(--color-negative, #dc2626)", marginTop: "-0.5rem" }}>
                Passwords do not match.
              </small>
            )}
            <button type="submit" className="primary-button">
              Save Profile
            </button>
            {errorMessage && <p className="negative-text">{errorMessage}</p>}
          </form>
          <hr style={{ margin: "1.5rem 0" }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Danger Zone</h3>
            <InfoTooltip content={TOOLTIP_COPY.DANGER_ZONE} />
          </div>
          <button
            type="button"
            className="danger-button"
            style={{
              background: "var(--color-negative, #dc2626)",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={openDeleteModal}
          >
            Delete Account
          </button>
        </article>
        <article className="card">
          <h2>Profile Summary</h2>
          <div className="stats-list">
            <div className="stats-row">
              <span>Name</span>
              <strong>{fullName}</strong>
            </div>
            <div className="stats-row">
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            {isOAuth && (
              <div className="stats-row">
                <span>Auth Method</span>
                <strong>Google</strong>
              </div>
            )}
          </div>
        </article>
      </section>
    </Layout>
  );
}
