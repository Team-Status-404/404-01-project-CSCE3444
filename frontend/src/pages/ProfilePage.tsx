import { useState } from "react";
import Layout from "../components/Layout";
import TopBar from "../components/TopBar";

const USER_ID = 1;

export default function ProfilePage() {
  const [fullName, setFullName] = useState("Yasas Timilsina");
  const [email, setEmail] = useState("student@unt.edu");
  const [password, setPassword] = useState("");
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [favoriteSector, setFavoriteSector] = useState("Technology");
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSavedMessage("");
    setErrorMessage("");
    try {
      const body: Record<string, string> = {
        user_id: String(USER_ID),
        full_name: fullName,
        email,
        risk_level: riskLevel,
        favorite_sector: favoriteSector,
      };
      if (password) {
        body.password = password;
      }
      const response = await fetch("http://localhost:5000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      setSavedMessage("Profile saved successfully.");
      setPassword("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }
    setErrorMessage("");
    try {
      const response = await fetch("http://localhost:5000/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      alert("Account deleted.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete account.");
    }
  }

  return (
    <Layout>
      <TopBar
        title="Profile Management"
        subtitle="Update user profile settings for the StockIQ dashboard."
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />
      <section className="form-layout">
        <article className="card">
          <h2>Edit Profile</h2>
          <form className="settings-form" onSubmit={handleSave}>
            <label>
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setSavedMessage("");
                }}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSavedMessage("");
                }}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                placeholder="Leave blank to keep current password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSavedMessage("");
                }}
              />
            </label>
            <label>
              Risk Preference
              <select
                value={riskLevel}
                onChange={(event) => {
                  setRiskLevel(event.target.value);
                  setSavedMessage("");
                }}
              >
                <option>Conservative</option>
                <option>Moderate</option>
                <option>Aggressive</option>
              </select>
            </label>
            <label>
              Favorite Sector
              <input
                type="text"
                value={favoriteSector}
                onChange={(event) => {
                  setFavoriteSector(event.target.value);
                  setSavedMessage("");
                }}
              />
            </label>
            <button type="submit" className="primary-button">
              Save Profile
            </button>
            {savedMessage && <p className="positive-text">{savedMessage}</p>}
            {errorMessage && <p className="negative-text">{errorMessage}</p>}
          </form>
          <hr style={{ margin: "1.5rem 0" }} />
          <h3>Danger Zone</h3>
          <button
            type="button"
            className="danger-button"
            style={{ background: "var(--color-negative, #dc2626)", color: "#fff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "4px", cursor: "pointer" }}
            onClick={handleDelete}
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
            <div className="stats-row">
              <span>Risk Level</span>
              <strong>{riskLevel}</strong>
            </div>
            <div className="stats-row">
              <span>Favorite Sector</span>
              <strong>{favoriteSector}</strong>
            </div>
          </div>
        </article>
      </section>
    </Layout>
  );
}
