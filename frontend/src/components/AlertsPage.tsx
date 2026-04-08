import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

interface WatchlistItem {
  ticker: string;
  alert_enabled: boolean;
  hype_threshold: number | null;
  direction: "above" | "below" | null;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<number>(75);
  const [editDirection, setEditDirection] = useState<"above" | "below">("above");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    fetchWatchlist();
  }, [user]);

  async function fetchWatchlist() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/watchlist`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load watchlist");
      const data = await res.json();
      setWatchlist(data.watchlist ?? []);
    } catch (err) {
      setError("Could not load your watchlist. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAlert(ticker: string, currentState: boolean) {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/watchlist/alert`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ user_id: user.user_id, ticker, is_enabled: !currentState }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setWatchlist((prev) => prev.map((item) => item.ticker === ticker ? { ...item, alert_enabled: !currentState } : item));
        setSuccessMessage(`Alert ${!currentState ? "enabled" : "disabled"} for ${ticker}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch { setError("Could not update alert."); }
    finally { setSaving(false); }
  }

  async function handleSaveEdit(ticker: string) {
    if (!user) return;
    if (editThreshold < 1 || editThreshold > 99) { setEditError("Threshold must be between 1 and 99."); return; }
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ user_id: user.user_id, ticker, hype_threshold: editThreshold, direction: editDirection }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setWatchlist((prev) => prev.map((item) => item.ticker === ticker ? { ...item, hype_threshold: editThreshold, direction: editDirection } : item));
        setEditingTicker(null);
        setSuccessMessage(`Alert updated for ${ticker}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else { setEditError(data.message ?? "Failed to save."); }
    } catch { setEditError("Could not reach server."); }
    finally { setSaving(false); }
  }

  async function handleDeleteAlert(ticker: string) {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/watchlist/alert`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ user_id: user.user_id, ticker, is_enabled: false }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setWatchlist((prev) => prev.map((item) => item.ticker === ticker ? { ...item, alert_enabled: false, hype_threshold: null, direction: null } : item));
        setSuccessMessage(`Alert deleted for ${ticker}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch { setError("Could not delete alert."); }
    finally { setSaving(false); }
  }

  return (
    <Layout>
      <TopBar title="My Alerts" subtitle="Manage your Hype Score notifications." />
      <section className="section-block" style={{ padding: "0 24px" }}>
        {successMessage && <p className="positive-text" style={{ marginBottom: 16, fontWeight: 600 }}>✓ {successMessage}</p>}
        {error && <p className="form-error" style={{ marginBottom: 16 }}>⚠ {error}</p>}
        {loading && <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading your alerts...</div>}
        {!loading && watchlist.length === 0 && !error && (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <p style={{ margin: 0 }}>You have no stocks in your watchlist yet.</p>
            <button onClick={() => navigate('/markets')} className="primary-button" style={{ marginTop: 16, padding: "10px 24px", border: "none", cursor: "pointer" }}>
              + Add Stocks from Markets
            </button>
          </div>
        )}
        {!loading && watchlist.length > 0 && (
          <article className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Your Watchlist Alerts</h3>
              <button onClick={() => navigate('/markets')} className="primary-button" style={{ padding: "8px 18px", fontSize: 13, border: "none", cursor: "pointer" }}>
                + Add New Stock
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr", padding: "10px 16px", background: "rgba(148,163,184,0.05)", borderRadius: 8, marginBottom: 8 }}>
              {["Ticker", "Threshold", "Direction", "Status", "Actions"].map((h) => (
                <span key={h} style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {watchlist.map((item) => (
                <div key={item.ticker}>
                  {editingTicker !== item.ticker && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr", alignItems: "center", padding: "16px", background: "rgba(15,23,42,0.4)", borderRadius: 10, border: "1px solid rgba(148,163,184,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.alert_enabled ? "#4ade80" : "#334155", boxShadow: item.alert_enabled ? "0 0 6px #4ade80" : "none" }} />
                        <strong>{item.ticker}</strong>
                      </div>
                      <span style={{ color: item.hype_threshold ? "#fff" : "#64748b" }}>{item.hype_threshold ?? "—"}</span>
                      <span style={{ color: item.direction ? "#38bdf8" : "#64748b" }}>{item.direction === "above" ? "▲ Above" : item.direction === "below" ? "▼ Below" : "—"}</span>
                      <span className={item.alert_enabled ? "pill positive" : "pill"} style={{ background: item.alert_enabled ? "rgba(74,222,128,0.12)" : "rgba(148,163,184,0.08)", color: item.alert_enabled ? "#4ade80" : "#64748b", border: `1px solid ${item.alert_enabled ? "rgba(74,222,128,0.3)" : "rgba(148,163,184,0.15)"}`, width: "fit-content" }}>
                        {item.alert_enabled ? "● Active" : "○ Inactive"}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingTicker(item.ticker); setEditThreshold(item.hype_threshold ?? 75); setEditDirection(item.direction ?? "above"); setEditError(null); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Edit</button>
                        <button onClick={() => handleToggleAlert(item.ticker, item.alert_enabled)} disabled={saving} style={{ padding: "6px 10px", borderRadius: 8, border: "none", fontSize: 12, background: item.alert_enabled ? "rgba(248,113,113,0.15)" : "linear-gradient(135deg,#2563eb,#0ea5e9)", color: item.alert_enabled ? "#f87171" : "#fff", cursor: "pointer" }}>{item.alert_enabled ? "Disable" : "Enable"}</button>
                        <button onClick={() => handleDeleteAlert(item.ticker)} disabled={saving} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "transparent", color: "#f87171", cursor: "pointer", fontSize: 12 }}>Delete</button>
                      </div>
                    </div>
                  )}
                  {editingTicker === item.ticker && (
                    <div style={{ padding: "20px", background: "rgba(37,99,235,0.08)", borderRadius: 10, border: "1px solid rgba(56,189,248,0.3)" }}>
                      <p style={{ margin: "0 0 14px", fontWeight: 600, color: "#38bdf8" }}>Editing alert for {item.ticker}</p>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>HYPE THRESHOLD (1-99)</label>
                        <input type="number" min={1} max={99} value={editThreshold} onChange={(e) => { setEditThreshold(Number(e.target.value)); setEditError(null); }} style={{ width: "100%", background: "#1e293b", border: `1px solid ${editError ? "#f87171" : "rgba(148,163,184,0.2)"}`, borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 16, outline: "none" }} />
                        {editError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#f87171" }}>⚠ {editError}</p>}
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>DIRECTION</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {(["above", "below"] as const).map((d) => (
                            <button key={d} onClick={() => setEditDirection(d)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${editDirection === d ? "#38bdf8" : "rgba(148,163,184,0.15)"}`, background: editDirection === d ? "rgba(56,189,248,0.12)" : "transparent", color: editDirection === d ? "#38bdf8" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{d === "above" ? "▲ Above" : "▼ Below"}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleSaveEdit(item.ticker)} disabled={saving} className="primary-button" style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving..." : "Save Changes"}</button>
                        <button onClick={() => { setEditingTicker(null); setEditError(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="card-note" style={{ marginTop: 20, fontSize: 13 }}>Alerts notify you when a stock's Hype Score crosses your set threshold.</p>
          </article>
        )}
      </section>
    </Layout>
  );
}