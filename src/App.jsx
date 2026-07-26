import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ScanPage from './pages/ScanPage';
import CheckoutPage from './pages/CheckoutPage';
import InventoryPage from './pages/InventoryPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProductsPage from './pages/ProductsPage';
import WorkersPage from './pages/WorkersPage';
import LoginPage from './pages/LoginPage';


function MainLayout({ globalSearch, setGlobalSearch }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-slate-900">
      <Header searchInput={globalSearch} setSearchInput={setGlobalSearch} />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full mb-16 lg:mb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/scan" replace />} />
            
            {/* General Authenticated Routes (Owner & Worker) */}
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />

            {/* Owner-Only Protected Routes */}
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['Owner']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Owner']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workers"
              element={
                <ProtectedRoute allowedRoles={['Owner']}>
                  <WorkersPage />
                </ProtectedRoute>
              }
            />

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
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

