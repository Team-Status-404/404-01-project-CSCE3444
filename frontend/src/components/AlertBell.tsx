import React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

// TYPES
interface AlertModalProps {
  ticker: string;
  onClose: () => void;
}

// VALIDATION HELPER
function validateThreshold(value: number): string | null {
  if (isNaN(value)) return "Please enter a valid number.";
  if (value < 1) return "Threshold must be at least 1.";
  if (value > 99) return "Threshold cannot exceed 99.";
  return null; // null = no error
}

//ALERT MODAL
function AlertModal({ ticker, onClose }: AlertModalProps) {
  const { user } = useAuth();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(75);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  //INPUT CHANGE HANDLER
  function handleThresholdChange(value: number) {
    setThreshold(value);
    setValidationError(validateThreshold(value));
    setApiError(null);
  }

  // SAVE HANDLER
  // Connects to: POST /api/watchlist/alert
  async function handleSave() {
    // Final validation check before saving
    const error = validateThreshold(threshold);
    if (error) {
      setValidationError(error);
      return;
    }

    if (!user) {
      setApiError("You must be logged in to save alerts.");
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
  const res = await fetch(`${API_URL}/api/alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      user_id: user.user_id,
      ticker: ticker,
      hype_threshold: threshold,
      direction: direction,
    }),
  });

  const data = await res.json();
  

      const data = await res.json();

      if (data.status === "success") {
        setSaved(true);
        // Close modal after short delay so user sees confirmation
        setTimeout(() => onClose(), 1500);
      } else {
        setApiError(data.message ?? "Failed to save alert. Please try again.");
      }
    } catch (err) {
      console.error("saveAlert error:", err);
      setApiError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // DERIVED STATE
  const hasError = validationError !== null;
  const isSaveDisabled = hasError || saving || saved;

  // Color based on threshold zone
  const thresholdColor =
    threshold < 33 ? "#4ade80" : threshold < 66 ? "#fbbf24" : "#f87171";

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      {/* Modal Card — stop click from closing when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: 20,
          padding: "28px 32px",
          width: "min(90%, 420px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          fontFamily: "inherit",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#64748b",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Configure Alert
            </p>
            <h3 style={{ margin: "4px 0 0", color: "#f8fafc", fontSize: 20 }}>
              {ticker} Hype Alert
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Enable / Disable Toggle ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(148, 163, 184, 0.05)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0" }}>
              Hype Score Threshold
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Notify me when score is triggered
            </p>
          </div>
          {/* Toggle Switch */}
          <div
            onClick={() => setIsEnabled((prev) => !prev)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 999,
              background: isEnabled
                ? "linear-gradient(135deg, #2563eb, #0ea5e9)"
                : "#1e293b",
              border: "1px solid rgba(148,163,184,0.2)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: isEnabled ? 24 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </div>

        {/* Threshold Slider */}
        <div style={{ marginBottom: 20, opacity: isEnabled ? 1 : 0.4, transition: "opacity 0.2s" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
              THRESHOLD SCORE
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: hasError ? "#f87171" : thresholdColor,
                transition: "color 0.2s",
              }}
            >
              {threshold}
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={99}
            value={threshold}
            disabled={!isEnabled}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: hasError ? "#f87171" : thresholdColor,
              cursor: isEnabled ? "pointer" : "not-allowed",
              marginBottom: 6,
            }}
          />

          {/* Zone labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#334155",
            }}
          >
            <span>1 — Cool</span>
            <span>50 — Warm</span>
            <span>99 — Hot</span>
          </div>

          {/* Numeric input for precise entry */}
          <div style={{ marginTop: 12 }}>
            <label
              style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}
            >
              Or type a precise value:
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={threshold}
              disabled={!isEnabled}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              style={{
                width: "100%",
                background: "#1e293b",
                border: `1px solid ${hasError ? "#f87171" : "rgba(148,163,184,0.2)"}`,
                borderRadius: 10,
                color: hasError ? "#f87171" : "#f8fafc",
                padding: "10px 14px",
                fontSize: 16,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {/* Alternate Flow 4a: Validation error message */}
            {hasError && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ⚠ {validationError}
              </p>
            )}
          </div>
        </div>

        {/*  Direction Toggle */}
        <div style={{ marginBottom: 24, opacity: isEnabled ? 1 : 0.4, transition: "opacity 0.2s" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
            TRIGGER WHEN SCORE IS
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {(["above", "below"] as const).map((d) => (
              <button
                key={d}
                disabled={!isEnabled}
                onClick={() => setDirection(d)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: `1px solid ${direction === d ? "#38bdf8" : "rgba(148,163,184,0.15)"}`,
                  background:
                    direction === d ? "rgba(56,189,248,0.12)" : "transparent",
                  color: direction === d ? "#38bdf8" : "#64748b",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isEnabled ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {d === "above" ? "▲ Above" : "▼ Below"}
              </button>
            ))}
          </div>
        </div>
        {/* API Error */}
        {apiError && (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              color: "#f87171",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            ⚠ {apiError}
          </p>
        )}

        {/* Save Button */}
        {/* * */}
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="primary-button full-width"
          style={{
            padding: "13px 0",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            borderRadius: 12,
            border: "none",
            background: saved
              ? "#4ade80"
              : isSaveDisabled
              ? "#1e293b"
              : "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: saved ? "#0f172a" : isSaveDisabled ? "#334155" : "#fff",
            cursor: isSaveDisabled ? "not-allowed" : "pointer",
            transition: "all 0.3s",
          }}
        >
          {saved ? "✓ Alert Saved!" : saving ? "Saving..." : "Save Alert"}
        </button>
      </div>
    </div>
  );
}

//BELL ICON BUTTON
interface AlertBellProps {
  ticker: string;
}

export default function AlertBell({ ticker }: AlertBellProps) {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setShowModal(true)}
        title={`Set alert for ${ticker}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 12,
          border: "1px solid rgba(148, 163, 184, 0.2)",
          background: "transparent",
          color: "#94a3b8",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#38bdf8";
          e.currentTarget.style.color = "#38bdf8";
          e.currentTarget.style.background = "rgba(56,189,248,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(148,163,184,0.2)";
          e.currentTarget.style.color = "#94a3b8";
          e.currentTarget.style.background = "transparent";
        }}
      >
        🔔 Set Alert
      </button>

      {/* Modal */}
      {showModal && (
        <AlertModal ticker={ticker} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}