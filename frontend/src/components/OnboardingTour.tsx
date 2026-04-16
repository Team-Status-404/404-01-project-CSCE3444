import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface TourStep {
  title: string;
  description: string;
  location: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  // ── 1. Dashboard overview ──────────────────────────────────────────────
  {
    title: 'Welcome to StockIQ',
    description:
      'This is your Market Intelligence Dashboard — your home base for tracking stocks, monitoring sentiment, and staying ahead of market moves.',
    location: "You're looking at it right now. Each card here is a stock you're following.",
    icon: '🏠',
  },
  // ── 2. Watchlist ───────────────────────────────────────────────────────
  {
    title: 'My Watchlist',
    description: TOOLTIP_COPY.WATCHLIST_SECTION,
    location: 'The cards in the grid below. Click any card to load its price vs. sentiment chart.',
    icon: '📋',
  },
  // ── 3. Hype Score ─────────────────────────────────────────────────────
  {
    title: 'Hype Score',
    description: TOOLTIP_COPY.HYPE_SCORE,
    location: 'Find it on any stock detail page in the "AI Hype Meter" panel (right column).',
    icon: '📊',
  },
  // ── 4. Divergence Warning ──────────────────────────────────────────────
  {
    title: 'Divergence Warning',
    description: TOOLTIP_COPY.DIVERGENCE_WARNING,
    location: 'Look for the red banner on your watchlist cards and on stock detail pages.',
    icon: '⚠️',
  },
  // ── 5. NLP Tags ────────────────────────────────────────────────────────
  {
    title: 'NLP Sentiment Tags',
    description: TOOLTIP_COPY.NLP_TAGS,
    location: 'Shown in the "Sentiment" section of the Hype Meter and in the NLP Tags card below the chart.',
    icon: '🏷️',
  },
  // ── 6. Markets page ───────────────────────────────────────────────────
  {
    title: 'Markets Page',
    description:
      'Visit Markets (left sidebar) to explore trending stocks and get a live overview of major market indices.',
    location: 'Click "Markets" in the left sidebar. Hit the + button next to any stock to add it to your watchlist.',
    icon: '🌐',
  },
  // ── 7. Stock Analysis ─────────────────────────────────────────────────
  {
    title: 'Stock Analysis Page',
    description:
      'Click any stock to open a full analysis page with live price charts, volatility stats, 52-week ranges, and the AI Hype Meter.',
    location: 'Click a stock ticker anywhere in the app, or search for one in the top search bar.',
    icon: '🔍',
  },
  // ── 8. Alerts ─────────────────────────────────────────────────────────
  {
    title: 'Hype Score Alerts',
    description: TOOLTIP_COPY.SET_ALERT,
    location: 'Use the 🔔 Set Alert button on any stock detail page. Manage all alerts under the Alerts page by clicking the bell icon in the top right corner of the navigation bar.',
    icon: '🔔',
  },
  // ── 9. ⓘ Icon ─────────────────────────────────────────────────────────
  {
    title: 'Look for the ⓘ Icon',
    description:
      "Throughout StockIQ, you'll see a small ⓘ icon next to certain metrics and features. Tap or hover over it anytime to learn what that component does.",
    location: "You'll find these icons next to almost every metric — on your Dashboard, Stock Detail pages, and Profile.",
    icon: 'ⓘ',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [dismissing, setDismissing] = useState(false);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  async function markComplete() {
    if (dismissing) return;
    setDismissing(true);
    try {
      await fetch(`${API_URL}/api/user/onboarding`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
    } catch {
      // fail silently — don't block the user from dismissing
    }
    onComplete();
  }

  return (
    // Backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 32,
        paddingLeft: 16,
        paddingRight: 16,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={markComplete}
    >
      {/* Tour card — stop propagation so clicking the card doesn't dismiss */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Skip button */}
        <button
          onClick={markComplete}
          disabled={dismissing}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          Skip tour ✕
        </button>

        {/* Progress indicator */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
            <span style={{ color: '#475569', fontSize: 11 }}>
              {Math.round(((step + 1) / TOUR_STEPS.length) * 100)}% complete
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i < step ? '#2563eb' : i === step ? '#38bdf8' : '#334155',
                  transition: 'width 0.25s ease, background 0.25s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{currentStep.icon}</span>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: 18 }}>
              {currentStep.title}
            </h3>
            <p style={{ margin: '0 0 10px 0', color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
              {currentStep.description}
            </p>
            <p style={{ margin: 0, color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
              {currentStep.location}
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? markComplete : () => setStep(step + 1)}
            disabled={dismissing}
            style={{
              padding: '9px 22px',
              background: '#38bdf8',
              border: 'none',
              color: '#0f172a',
              borderRadius: 8,
              cursor: dismissing ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: dismissing ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isLast ? (dismissing ? 'Saving…' : 'Got it!') : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
