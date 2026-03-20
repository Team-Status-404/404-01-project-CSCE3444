import { useState, useEffect, useRef } from "react";

// ─── LIVE FLASK BACKEND ───────────────────────────────────────────────────────
async function fetchHypeScore(ticker) {
  try {
    const response = await fetch(`http://localhost:5000/api/sentiment/${ticker}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // Map the Python backend dictionary to the exact keys Krish's React UI expects
    return {
      ticker: data.ticker,
      hypeScore: data.hype_score,
      sentiment: data.tag,
      headline_count: data.metrics.news_volume + data.metrics.social_volume,
      cached: false,
    };
  } catch (err) {
    console.error("Error fetching live data:", err);
    // Fallback data if Flask is off, so the UI doesn't crash
    return {
      ticker: ticker,
      hypeScore: 50,
      sentiment: "Neutral",
      headline_count: 0,
      cached: false,
    };
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function scoreToColor(score) {
  if (score < 33) return { main: "#00E5A0", glow: "rgba(0,229,160,0.4)", label: "COOL" };
  if (score < 66) return { main: "#FFD166", glow: "rgba(255,209,102,0.4)", label: "WARM" };
  return { main: "#FF4D6D", glow: "rgba(255,77,109,0.45)", label: "HOT" };
}

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── SPEEDOMETER SVG ───────────────────────────────────────────────────────
function Speedometer({ score, loading }) {
  const animScore = useAnimatedValue(score, 800);
  const { main, glow } = scoreToColor(score);

  const cx = 160, cy = 140, R = 110;
  const startAngle = -210, endAngle = 30; // 240° sweep
  const totalArc = endAngle - startAngle;
  const angle = startAngle + (animScore / 100) * totalArc;

  function arcPath(r, from, to) {
    const s = polarToXY(cx, cy, r, from);
    const e = polarToXY(cx, cy, r, to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needle = polarToXY(cx, cy, R - 14, angle);

  // tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = startAngle + (i / 10) * totalArc;
    const inner = polarToXY(cx, cy, R - 8, a);
    const outer = polarToXY(cx, cy, R + 2, a);
    return { inner, outer, major: i % 2 === 0 };
  });

  return (
    <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 340, filter: loading ? "opacity(0.5)" : "none", transition: "filter 0.3s" }}>
      <defs>
        <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E5A0" />
          <stop offset="50%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FF4D6D" />
        </linearGradient>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="dialBg" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#1a1f2e" />
          <stop offset="100%" stopColor="#0d1117" />
        </radialGradient>
      </defs>

      {/* Dial background */}
      <ellipse cx={cx} cy={cy} rx={R + 22} ry={R + 18} fill="url(#dialBg)" stroke="#1e2535" strokeWidth="1.5" />

      {/* Track (grey) */}
      <path d={arcPath(R, startAngle, endAngle)} fill="none" stroke="#1e2a3a" strokeWidth={14} strokeLinecap="round" />

      {/* Filled arc */}
      <path d={arcPath(R, startAngle, angle)} fill="none" stroke="url(#trackGrad)" strokeWidth={14} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />

      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y}
          stroke={t.major ? "#4a5568" : "#2d3748"} strokeWidth={t.major ? 1.5 : 1} />
      ))}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y}
        stroke={main} strokeWidth={2.5} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${glow})`, transition: "x2 0.8s cubic-bezier(.34,1.56,.64,1), y2 0.8s cubic-bezier(.34,1.56,.64,1)" }} />
      <circle cx={cx} cy={cy} r={7} fill={main} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
      <circle cx={cx} cy={cy} r={3} fill="#0d1117" />

      {/* Score text */}
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize="36" fontWeight="700" fontFamily="'DM Mono', monospace" fill={main}
        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
        {loading ? "—" : Math.round(animScore)}
      </text>
      <text x={cx} y={cy + 55} textAnchor="middle" fontSize="10" fontFamily="'Space Grotesk', sans-serif" fill="#4a5568" letterSpacing="3">
        HYPE SCORE
      </text>

      {/* Labels */}
      {[["0", startAngle], ["50", startAngle + totalArc / 2], ["100", endAngle]].map(([lbl, a], i) => {
        const p = polarToXY(cx, cy, R + 18, a);
        return <text key={i} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fill="#3a4556" fontFamily="'DM Mono', monospace">{lbl}</text>;
      })}
    </svg>
  );
}

// ─── ANIMATED NUMBER HOOK ─────────────────────────────────────────────────
function useAnimatedValue(target, duration = 600) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  const raf = useRef(null);
  useEffect(() => {
    const start = prev.current, end = target, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(start + (end - start) * ease);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = end;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ─── SENTIMENT BADGE ───────────────────────────────────────────────────────
function SentimentBadge({ sentiment }) {
  const map = {
    Positive: { bg: "rgba(0,229,160,0.12)", border: "#00E5A0", color: "#00E5A0", icon: "▲" },
    Neutral:  { bg: "rgba(255,209,102,0.12)", border: "#FFD166", color: "#FFD166", icon: "●" },
    Negative: { bg: "rgba(255,77,109,0.12)", border: "#FF4D6D", color: "#FF4D6D", icon: "▼" },
  };
  const s = map[sentiment] || map.Neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 4,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11,
      fontFamily: "'DM Mono', monospace", letterSpacing: 1, fontWeight: 600 }}>
      {s.icon} {sentiment?.toUpperCase()}
    </span>
  );
}

// ─── ALERT CONFIG PANEL ────────────────────────────────────────────────────
function AlertPanel({ ticker, onSave, onClose }) {
  const [threshold, setThreshold] = useState(75);
  const [direction, setDirection] = useState("above");
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);
  const [saved, setSaved] = useState(false);

  const { main, glow } = scoreToColor(threshold);

  const handleSave = () => {
    onSave({ ticker, threshold, direction, email, push });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: "#0f1420", border: "1px solid #1e2a3a", borderRadius: 16, padding: "28px 32px",
        width: 360, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", fontFamily: "'Space Grotesk', sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "#4a5568", letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>CONFIGURE ALERT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>{ticker} Hype Alert</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* Threshold slider */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#8892a0", letterSpacing: 1 }}>HYPE THRESHOLD</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: main, fontFamily: "'DM Mono', monospace",
              textShadow: `0 0 12px ${glow}` }}>{threshold}</span>
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 3, background: "#1a2236", marginBottom: 8 }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${threshold}%`,
              borderRadius: 3, background: `linear-gradient(90deg, #00E5A0, #FFD166, #FF4D6D)`,
              boxShadow: `0 0 8px ${glow}` }} />
          </div>
          <input type="range" min={1} max={99} value={threshold} onChange={e => setThreshold(+e.target.value)}
            style={{ width: "100%", accentColor: main, cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2d3748", fontFamily: "'DM Mono', monospace" }}>
            <span>0 — COOL</span><span>50 — WARM</span><span>100 — HOT</span>
          </div>
        </div>

        {/* Direction toggle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#8892a0", letterSpacing: 1, marginBottom: 8 }}>TRIGGER WHEN SCORE IS</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["above", "below"].map(d => (
              <button key={d} onClick={() => setDirection(d)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${direction === d ? main : "#1e2a3a"}`,
                background: direction === d ? `${main}18` : "#0d1117",
                color: direction === d ? main : "#4a5568", fontSize: 12, cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: 1,
                transition: "all 0.2s", boxShadow: direction === d ? `0 0 12px ${glow}` : "none"
              }}>
                {d === "above" ? "▲ ABOVE" : "▼ BELOW"}
              </button>
            ))}
          </div>
        </div>

        {/* Notification channels */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#8892a0", letterSpacing: 1, marginBottom: 8 }}>NOTIFY VIA</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["Email", email, setEmail], ["Push", push, setPush]].map(([lbl, val, setter]) => (
              <button key={lbl} onClick={() => setter(!val)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${val ? "#6366f1" : "#1e2a3a"}`,
                background: val ? "rgba(99,102,241,0.12)" : "#0d1117",
                color: val ? "#818cf8" : "#4a5568", fontSize: 12, cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, transition: "all 0.2s",
                boxShadow: val ? "0 0 12px rgba(99,102,241,0.3)" : "none"
              }}>
                {lbl === "Email" ? "✉ " : "🔔 "}{lbl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={!email && !push} style={{
          width: "100%", padding: "13px 0", borderRadius: 10,
          background: saved ? "#00E5A0" : ((!email && !push) ? "#1a2236" : `linear-gradient(135deg, ${main}, ${main}cc)`),
          border: "none", color: saved ? "#0d1117" : ((!email && !push) ? "#2d3748" : "#0d1117"),
          fontSize: 13, fontWeight: 700, cursor: (!email && !push) ? "not-allowed" : "pointer",
          fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 1.5,
          transition: "all 0.3s", boxShadow: (!email && !push) ? "none" : `0 4px 20px ${glow}`
        }}>
          {saved ? "✓ ALERT SAVED" : "SAVE ALERT"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function HypeMeter() {
  const [ticker, setTicker] = useState("TSLA");
  const [input, setInput] = useState("TSLA");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState([]);
  const [error, setError] = useState(null);

  const load = async (sym) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHypeScore(sym);
      setData(result);
    } catch {
      setError("Sentiment data unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(ticker); }, [ticker]);

  const handleSearch = (e) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (sym) { setTicker(sym); }
  };

  const { main, glow, label } = scoreToColor(data?.hypeScore ?? 50);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        input[type=range]::-webkit-slider-thumb { width: 16px; height: 16px; border-radius: 50%; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24, fontFamily: "'Space Grotesk', sans-serif" }}>

        <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn 0.4s ease" }}>

          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00E5A0, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📈</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>StockIQ</div>
              <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>HYPE METER</div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Enter ticker… e.g. AAPL"
              style={{ flex: 1, background: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 10,
                padding: "11px 16px", color: "#e2e8f0", fontSize: 14, outline: "none",
                fontFamily: "'DM Mono', monospace", letterSpacing: 1 }} />
            <button type="submit" style={{ padding: "11px 20px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: 1 }}>
              SCAN
            </button>
          </form>

          {/* Card */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 20,
            padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

            {/* Ticker row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0", fontFamily: "'DM Mono', monospace",
                  letterSpacing: 2 }}>{ticker}</div>
                {data && <div style={{ marginTop: 6 }}><SentimentBadge sentiment={data.sentiment} /></div>}
              </div>
              <button onClick={() => setShowAlert(true)} title="Set Alert"
                style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 10,
                  padding: "8px 12px", cursor: "pointer", fontSize: 18, color: "#4a5568",
                  transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#818cf8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2a3a"; e.currentTarget.style.color = "#4a5568"; }}>
                🔔
              </button>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div style={{ fontSize: 10, color: "#4a5568", fontFamily: "'DM Mono', monospace",
                letterSpacing: 2, marginBottom: 4, animation: "pulse 1s infinite" }}>
                FETCHING SENTIMENT DATA…
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(255,77,109,0.1)", border: "1px solid #FF4D6D",
                borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#FF4D6D", marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}

            {/* Speedometer */}
            <Speedometer score={data?.hypeScore ?? 0} loading={loading} />

            {/* Heat label */}
            {data && !loading && (
              <div style={{ textAlign: "center", marginTop: -8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 4,
                  color: main, textShadow: `0 0 10px ${glow}`, fontWeight: 600 }}>
                  {label} ZONE
                </span>
              </div>
            )}

            {/* Stats row */}
            {data && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["ARTICLES SCANNED", data.headline_count],
                  ["CACHE STATUS", data.cached ? "HIT" : "MISS"],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "#080c14", borderRadius: 10, padding: "12px 14px",
                    border: "1px solid #1a2236" }}>
                    <div style={{ fontSize: 9, color: "#3a4556", letterSpacing: 2, marginBottom: 4,
                      fontFamily: "'DM Mono', monospace" }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#8892a0",
                      fontFamily: "'DM Mono', monospace" }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh */}
            <button onClick={() => load(ticker)} disabled={loading} style={{
              width: "100%", padding: "11px 0", borderRadius: 10, border: "1px solid #1e2a3a",
              background: "transparent", color: loading ? "#2d3748" : "#4a5568", fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: 1, transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "#2d3748"; e.currentTarget.style.color = "#8892a0"; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2a3a"; e.currentTarget.style.color = "#4a5568"; }}>
              ↻ REFRESH
            </button>
          </div>

          {/* Active alerts */}
          {savedAlerts.length > 0 && (
            <div style={{ marginTop: 16, background: "#0d1117", border: "1px solid #1e2a3a",
              borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: 3, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
                ACTIVE ALERTS
              </div>
              {savedAlerts.map((a, i) => {
                const c = scoreToColor(a.threshold);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: i < savedAlerts.length - 1 ? "1px solid #1a2236" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.main,
                        boxShadow: `0 0 6px ${c.glow}` }} />
                      <span style={{ fontSize: 13, color: "#8892a0", fontFamily: "'DM Mono', monospace" }}>
                        {a.ticker}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: c.main, fontFamily: "'DM Mono', monospace" }}>
                      {a.direction === "above" ? "▲" : "▼"} {a.threshold}
                    </span>
                    <button onClick={() => setSavedAlerts(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "#3a4556", cursor: "pointer", fontSize: 14 }}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAlert && (
        <AlertPanel ticker={ticker} onClose={() => setShowAlert(false)}
          onSave={(alert) => setSavedAlerts(prev => [...prev.filter(a => a.ticker !== alert.ticker), alert])} />
      )}
    </>
  );
}
