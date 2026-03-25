import { useState } from "react";
import Layout from "../components/Layout";
import TopBar from "../components/TopBar";


export default function ProfilePage() {
  const [fullName, setFullName] = useState("Yasas Timilsina");
  const [email, setEmail] = useState("student@unt.edu");
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [favoriteSector, setFavoriteSector] = useState("Technology");
  const [savedMessage, setSavedMessage] = useState("");
  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSavedMessage("Profile saved successfully.");
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
          <p className="card-note">
            This is a frontend-only profile page for Sprint 2.
          </p>
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
          </form>
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
