import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StockDetailPage from './pages/StockDetailPage';
import MarketsPage from './pages/MarketsPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import ProtectedRoute from './components/ProtectedRoute';
import AlertsPage from './pages/AlertsPage';
import WatchlistPage from './pages/WatchlistPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingTour from './components/OnboardingTour';
import { useTour } from './context/TourContext';

// wrapper forces StockDetailPage to fully remount
// every time the ticker in the URL changes (e.g. from the SearchBar)
function StockDetailWrapper() {
  const location = useLocation();
  return <StockDetailPage key={location.pathname} />;
}

export default function App() {
  const { showTour, isRevisit, endTour } = useTour();

  return (
    <>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* --- PROTECTED ROUTES --- */}
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/markets" element={<ProtectedRoute><MarketsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/stock/:ticker" element={<ProtectedRoute><StockDetailWrapper /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
      </Routes>
      {showTour && <OnboardingTour onComplete={endTour} isRevisit={isRevisit} />}
    </>
  );
}
