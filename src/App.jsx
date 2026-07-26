import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScanPage from './pages/ScanPage';
import CheckoutPage from './pages/CheckoutPage';
import InventoryPage from './pages/InventoryPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProductsPage from './pages/ProductsPage';
import WorkersPage from './pages/WorkersPage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/authStore';

function MainLayout({ globalSearch, setGlobalSearch }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-slate-900">
      <Header searchInput={globalSearch} setSearchInput={setGlobalSearch} />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full mb-16 lg:mb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/scan" replace />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="*" element={<Navigate to="/scan" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<MainLayout globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />} />
      </Routes>
    </Router>
  );
}
