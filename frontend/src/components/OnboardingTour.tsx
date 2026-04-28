import { useState, useEffect, type CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TOOLTIP_COPY } from '../constants/tooltipCopy';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MODAL_W = 480;
const MODAL_H = 290; // approximate modal height

interface TourStep {
  title: string;
  description: string;
  location: string;
  icon: string;
  /** Route to navigate to when this card becomes active. */
  page?: string;
  /** CSS selector of the element to anchor the modal beside. Falls back to center if not found. */
  targetSelector?: string;
}

const TOUR_STEPS: TourStep[] = [
  // ── 1. Dashboard overview ──────────────────────────────────────────────
  {
    title: 'Welcome to StockIQ',
    description:
      'This is your Market Intelligence Dashboard — your home base for tracking stocks, monitoring sentiment, and staying ahead of market moves.',
    location: "You're looking at it right now. Each card here is a stock you're following.",
    icon: '🏠',
    page: '/dashboard',
  },
  // ── 2. Watchlist ───────────────────────────────────────────────────────
  {
    title: 'My Watchlist',
    description: TOOLTIP_COPY.WATCHLIST_SECTION,
    location: 'The cards in the grid below. Click any card to load its price vs. sentiment chart.',
    icon: '📋',
    page: '/dashboard',
    targetSelector: '[data-tour="watchlist-section"]',
  },
  // ── 3. Hype Score ─────────────────────────────────────────────────────
  {
    title: 'Hype Score',
    description: TOOLTIP_COPY.HYPE_SCORE,
    location: 'Find it on any stock detail page in the "AI Hype Meter" panel (right column).',
    icon: '📊',
    page: '/dashboard',
  },
  // ── 4. Divergence Warning ──────────────────────────────────────────────
  {
    title: 'Divergence Warning',
    description: TOOLTIP_COPY.DIVERGENCE_WARNING,
    location: 'Look for the red banner on your watchlist cards and on stock detail pages.',
    icon: '⚠️',
    page: '/dashboard',
    targetSelector: '[data-tour="divergence-warning"]',
  },
  // ── 5. NLP Tags ────────────────────────────────────────────────────────
  {
    title: 'NLP Sentiment Tags',
    description: TOOLTIP_COPY.NLP_TAGS,
    location: 'Shown in the "Sentiment" section of the Hype Meter and in the NLP Tags card below the chart.',
    icon: '🏷️',
    page: '/dashboard',
  },
  // ── 6. Markets page ───────────────────────────────────────────────────
  {
    title: 'Markets Page',
    description:
      'Visit Markets (left sidebar) to explore trending stocks and get a live overview of major market indices.',
    location: 'Click "Markets" in the left sidebar. Hit the + button next to any stock to add it to your watchlist.',
    icon: '🌐',
    page: '/markets',
  },
  // ── 7. Stock Analysis ─────────────────────────────────────────────────
  {
    title: 'Stock Analysis Page',
    description:
      'Click any stock to open a full analysis page with live price charts, volatility stats, 52-week ranges, and the AI Hype Meter.',
    location: 'Click a stock ticker anywhere in the app, or search for one in the top search bar.',
    icon: '🔍',
    page: '/markets',
    targetSelector: '[data-tour="search-bar"]',
  },
  // ── 8. Alerts ─────────────────────────────────────────────────────────
  {
    title: 'Hype Score Alerts',
    description: TOOLTIP_COPY.SET_ALERT,
    location: 'Use the 🔔 Set Alert button on any stock detail page. Manage all alerts under the Alerts page by clicking the bell icon in the top right corner of the navigation bar.',
    icon: '🔔',
    page: '/dashboard',
    targetSelector: '[data-tour="alerts-bell"]',
  },
  // ── 9. ⓘ Icon ─────────────────────────────────────────────────────────
  {
    title: 'Look for the ⓘ Icon',
    description:
      "Throughout StockIQ, you'll see a small ⓘ icon next to certain metrics and features. Tap or hover over it anytime to learn what that component does.",
    location: "You'll find these icons next to almost every metric — on your Dashboard, Stock Detail pages, and Profile.",
    icon: 'ⓘ',
    page: '/dashboard',
    targetSelector: '#tour-info-tooltip-demo',
  },
];

// ── Positioning helpers ────────────────────────────────────────────────────

interface ModalLayout {
  top: number;
  left: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset: number;
}

function computeLayout(selector: string | undefined): ModalLayout | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 14;

  const targetCX = rect.left + rect.width / 2;
  const targetCY = rect.top + rect.height / 2;

  let top: number, left: number;
  let arrowSide: ModalLayout['arrowSide'];
  let arrowOffset: number;

  if (vh - rect.bottom >= MODAL_H + GAP) {
    // Below
    top = rect.bottom + GAP;
    left = Math.max(16, Math.min(targetCX - MODAL_W / 2, vw - MODAL_W - 16));
    arrowSide = 'top';
    arrowOffset = targetCX - left - 10;
  } else if (rect.top >= MODAL_H + GAP) {
    // Above
    top = rect.top - MODAL_H - GAP;
    left = Math.max(16, Math.min(targetCX - MODAL_W / 2, vw - MODAL_W - 16));
    arrowSide = 'bottom';
    arrowOffset = targetCX - left - 10;
  } else if (vw - rect.right >= MODAL_W + GAP) {
    // Right
    left = rect.right + GAP;
    top = Math.max(16, Math.min(targetCY - MODAL_H / 2, vh - MODAL_H - 16));
    arrowSide = 'left';
    arrowOffset = targetCY - top - 10;
  } else if (rect.left >= MODAL_W + GAP) {
    // Left
    left = rect.left - MODAL_W - GAP;
    top = Math.max(16, Math.min(targetCY - MODAL_H / 2, vh - MODAL_H - 16));
    arrowSide = 'right';
    arrowOffset = targetCY - top - 10;
  } else {
    return null; // not enough room — fall back to center
  }

  const maxOff =
    arrowSide === 'top' || arrowSide === 'bottom' ? MODAL_W - 44 : MODAL_H - 44;
  arrowOffset = Math.max(20, Math.min(arrowOffset, maxOff));

  return { top, left, arrowSide, arrowOffset };
}

// ── Component ─────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  onComplete: () => void;
  isRevisit?: boolean;
}

export default function OnboardingTour({ onComplete, isRevisit = false }: OnboardingTourProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const [modalLayout, setModalLayout] = useState<ModalLayout | null>(null);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Navigate to the step's page when the step changes
  useEffect(() => {
    if (currentStep.page && location.pathname !== currentStep.page) {
      navigate(currentStep.page);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-compute modal position after navigation settles and on step change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setModalLayout(computeLayout(currentStep.targetSelector));
    }, 150);
    return () => clearTimeout(timer);
  }, [step, location.pathname, currentStep.targetSelector]);

  async function markComplete() {
    if (dismissing) return;
    setDismissing(true);
    // On revisit, skip the PATCH so the backend flag stays clean
    if (!isRevisit) {
      try {
        await fetch(`${API_URL}/api/user/onboarding`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${user?.token}` },
        });
      } catch {
        // fail silently — don't block the user from dismissing
      }
    }
    onComplete();
  }

  // ── Arrow renderer ────────────────────────────────────────────────────

  function renderArrow(layout: ModalLayout) {
    const { arrowSide, arrowOffset } = layout;
    const S = 10; // half-size
    const base: CSSProperties = { position: 'absolute', width: 0, height: 0 };

    if (arrowSide === 'top')
      return (
        <div style={{ ...base, top: -S, left: arrowOffset,
          borderLeft: `${S}px solid transparent`,
          borderRight: `${S}px solid transparent`,
          borderBottom: `${S}px solid #1e293b` }} />
      );
    if (arrowSide === 'bottom')
      return (
        <div style={{ ...base, bottom: -S, left: arrowOffset,
          borderLeft: `${S}px solid transparent`,
          borderRight: `${S}px solid transparent`,
          borderTop: `${S}px solid #1e293b` }} />
      );
    if (arrowSide === 'left')
      return (
        <div style={{ ...base, left: -S, top: arrowOffset,
          borderTop: `${S}px solid transparent`,
          borderBottom: `${S}px solid transparent`,
          borderRight: `${S}px solid #1e293b` }} />
      );
    return (
      <div style={{ ...base, right: -S, top: arrowOffset,
        borderTop: `${S}px solid transparent`,
        borderBottom: `${S}px solid transparent`,
        borderLeft: `${S}px solid #1e293b` }} />
    );
  }

  // ── Shared card style ─────────────────────────────────────────────────

  const cardBase: CSSProperties = {
    width: MODAL_W,
    maxWidth: 'calc(100vw - 32px)',
    background: '#1e293b',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    borderRadius: 16,
    padding: '24px 28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    position: 'absolute',
  };

  const cardStyle: CSSProperties = modalLayout
    ? { ...cardBase, top: modalLayout.top, left: modalLayout.left }
    : { ...cardBase, bottom: 32, left: '50%', transform: 'translateX(-50%)' };

  return (
    // Backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: modalLayout ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={markComplete}
    >
      {/* Tour card — stop propagation so clicking the card doesn't dismiss */}
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>

        {/* Directional arrow pointing at the target element */}
        {modalLayout && renderArrow(modalLayout)}

        {/* Skip button */}
        <button
          onClick={markComplete}
          disabled={dismissing}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 12, padding: '4px 8px',
            borderRadius: 6, transition: 'color 0.15s',
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
          <div style={{ height: 4, background: '#0f172a', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                background: i < step ? '#2563eb' : i === step ? '#38bdf8' : '#334155',
                transition: 'width 0.25s ease, background 0.25s ease',
              }} />
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
                padding: '9px 18px', background: 'transparent',
                border: '1px solid #334155', color: '#94a3b8',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
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
              padding: '9px 22px', background: '#38bdf8',
              border: 'none', color: '#0f172a', borderRadius: 8,
              cursor: dismissing ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              opacity: dismissing ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {isLast ? (dismissing ? 'Saving…' : 'Got it!') : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
