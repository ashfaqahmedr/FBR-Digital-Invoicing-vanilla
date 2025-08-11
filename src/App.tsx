import React, { useState, useEffect } from 'react';
import { InvoiceProvider, useInvoiceContext } from './context/InvoiceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { api } from './services/api';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { dispatch } = useInvoiceContext();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [sellers, buyers, products] = await Promise.all([
          api.getSellers(),
          api.getBuyers(),
          api.getProducts(),
        ]);
        
        dispatch({ type: 'SET_SELLERS', payload: sellers });
        dispatch({ type: 'SET_BUYERS', payload: buyers });
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        
        // Set first seller as current if available
        if (sellers.length > 0) {
          dispatch({ type: 'SET_CURRENT_SELLER', payload: sellers[0] });
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'invoicing':
        return 'Invoice Management';
      case 'entities':
        return 'Manage Entities';
      case 'settings':
        return 'Settings';
      default:
        return 'FBR Digital Invoices';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoicing':
        return <Home />;
      case 'entities':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Manage Entities
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Entity management features will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Seller management with NTN validation</li>
              <li>• Buyer database with registration verification</li>
              <li>• Product catalog with HS codes and tax rates</li>
              <li>• Import/export functionality</li>
            </ul>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Application settings will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
              <li>• FBR API configuration</li>
              <li>• Environment switching (Sandbox/Production)</li>
              <li>• User preferences</li>
              <li>• Data backup and restore</li>
            </ul>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={getPageTitle()}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <InvoiceProvider>
      <AppContent />
    </InvoiceProvider>
  );
}

export default App;