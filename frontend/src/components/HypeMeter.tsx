import React, { useState, useEffect } from "react";

// ─── TYPESCRIPT DEFINITIONS ────────────────────────────────────────────────
interface HypeData {
  ticker: string;
  hypeScore: number;
  sentiment: string;
  headline_count: number;
  cached: boolean;
}

interface ColorConfig {
  main: string;
  glow: string;
  label: string;
}

interface Alert {
  ticker: string;
  direction: "above" | "below";
  threshold: number;
}

// ─── LIVE FLASK BACKEND ────────────────────────────────────────────────────
async function fetchHypeScore(ticker: string): Promise<HypeData> {
  try {
    const response = await fetch(`http://localhost:5000/api/sentiment/${ticker}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    return {
      ticker: data.ticker,
      hypeScore: data.hype_score,
      sentiment: data.tag,
      headline_count: data.metrics.news_volume + data.metrics.social_volume,
      cached: false,
    };
  } catch (err) {
    console.error("Error fetching live data:", err);
    // Fallback data if Flask is offline, so the UI doesn't crash
    return {
      ticker: ticker.toUpperCase(),
      hypeScore: 50,
      sentiment: "Neutral",
      headline_count: 0,
      cached: false,
    };
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function scoreToColor(score: number): ColorConfig {
  if (score < 33) return { main: "#00E5A0", glow: "rgba(0,229,160,0.4)", label: "COOL" };
  if (score < 66) return { main: "#FFD166", glow: "rgba(255,209,102,0.4)", label: "WARM" };
  return { main: "#FF4D6D", glow: "rgba(255,77,109,0.45)", label: "HOT" };
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── ALERT PANEL COMPONENT ─────────────────────────────────────────────────
interface AlertPanelProps {
  ticker: string;
  onClose: () => void;
  onSave: (alert: Alert) => void;
}

function AlertPanel({ ticker, onClose, onSave }: AlertPanelProps) {
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState<number>(80);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,14,23,0.9)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, zIndex: 10 }}>
      <div style={{ background: "#1a2236", padding: 20, borderRadius: 12, width: "80%", border: "1px solid #2a3441", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h4 style={{ margin: "0 0 15px 0", color: "#fff" }}>Set Alert for {ticker}</h4>
        
        <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
          <button onClick={() => setDirection("above")} style={{ flex: 1, padding: "8px", background: direction === "above" ? "#38bdf8" : "#2a3441", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Above</button>
          <button onClick={() => setDirection("below")} style={{ flex: 1, padding: "8px", background: direction === "below" ? "#38bdf8" : "#2a3441", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Below</button>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#8892a0", fontSize: 12, marginBottom: 5 }}>Threshold Score (0-100)</label>
          <input type="range" min="0" max="100" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: "100%" }} />
          <div style={{ textAlign: "center", color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 5 }}>{threshold}</div>
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "transparent", color: "#8892a0", border: "1px solid #3a4556", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave({ ticker, direction, threshold }); onClose(); }} style={{ flex: 1, padding: "10px", background: "#38bdf8", color: "#000", fontWeight: "bold", border: "none", borderRadius: 6, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function HypeMeter() {
  const [ticker, setTicker] = useState<string>("NVDA");
  const [data, setData] = useState<HypeData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [savedAlerts, setSavedAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let active = true;

    // 1. Define an async function inside the effect
    const loadHypeData = async () => {
      setLoading(true); 
      
      try {
        const res = await fetchHypeScore(ticker);
        if (active) {
          setData(res);
        }
      } catch (error) {
        console.error("Failed to fetch hype score:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    // 2. Call the function
    loadHypeData();

    // 3. Cleanup to prevent memory leaks if the user clicks away early
    return () => {
      active = false;
    };
  }, [ticker]);

  if (!data) return <div style={{ color: "#8892a0" }}>Loading gauge...</div>;

  const score = data.hypeScore;
  const colorConf = scoreToColor(score);

  // Gauge SVG Math
  const r = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + (score / 100) * totalAngle;

  const startPt = polarToXY(cx, cy, r, startAngle);
  const endPt = polarToXY(cx, cy, r, endAngle);
  const currentPt = polarToXY(cx, cy, r, currentAngle);

  const trackArc = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 1 1 ${endPt.x} ${endPt.y}`;
  const fillArc = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${currentPt.x} ${currentPt.y}`;

  return (
    <div style={{ position: "relative", width: 260, background: "transparent", borderRadius: 16, padding: 20, fontFamily: "inherit" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: colorConf.main, boxShadow: `0 0 8px ${colorConf.glow}` }} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{data.ticker}</span>
        </div>
        <button onClick={() => setShowAlert(true)} style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", transition: "0.2s" }}>
          + Alert
        </button>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" 
          value={ticker} 
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "8px 12px", borderRadius: 6, outline: "none", fontSize: 14 }}
          placeholder="Enter ticker..."
        />
      </div>

      {/* SVG Gauge */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative", height: 130 }}>
        <svg width="200" height="150" viewBox="0 0 200 150">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d={trackArc} fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
          <path d={fillArc} fill="none" stroke={colorConf.main} strokeWidth="12" strokeLinecap="round" filter="url(#glow)" style={{ transition: "stroke-dasharray 1s ease-out" }} />
          <circle cx={currentPt.x} cy={currentPt.y} r="6" fill="#fff" filter="url(#glow)" />
        </svg>
        
        <div style={{ position: "absolute", top: 60, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: "1" }}>{loading ? "..." : score}</div>
          <div style={{ fontSize: 12, color: colorConf.main, fontWeight: 600, letterSpacing: 1 }}>{colorConf.label}</div>
        </div>
      </div>

      {/* Footer Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1e293b", paddingTop: 15, marginTop: 10 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Sentiment</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{data.sentiment}</div>
        </div>
        <div style={{ width: 1, background: "#1e293b" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Signals</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{data.headline_count} detected</div>
        </div>
      </div>

      {/* Alerts List */}
      {savedAlerts.length > 0 && (
        <div style={{ marginTop: 15, background: "#1e293b", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" }}>Active Alerts</div>
          {savedAlerts.map((a, i) => {
            const c = scoreToColor(a.threshold);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < savedAlerts.length - 1 ? "1px solid #334155" : "none" }}>
                <span style={{ fontSize: 12, color: "#fff" }}>{a.ticker}</span>
                <span style={{ fontSize: 12, color: c.main }}>{a.direction === "above" ? "▲" : "▼"} {a.threshold}</span>
                <button onClick={() => setSavedAlerts(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {showAlert && (
        <AlertPanel ticker={ticker} onClose={() => setShowAlert(false)} onSave={(alert) => setSavedAlerts(prev => [...prev.filter(a => a.ticker !== alert.ticker), alert])} />
      )}
    </div>
  );
}