import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StockDetailPage from './pages/StockDetailPage';
import MarketsPage from './pages/MarketsPage'; // Add this import

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/markets" element={<MarketsPage />} />       
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/stock/nvda" element={<StockDetailPage />} />  
    </Routes>
  );
}