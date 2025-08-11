import React, { useState, useEffect } from 'react';
import { useInvoiceContext } from './context/InvoiceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { api } from './services/api';
import { Entities } from './pages/Entities';
import { TestApis } from './pages/TestApis';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { dispatch } = useInvoiceContext();

  useEffect(() => {
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
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'invoicing': return 'Invoice Management';
      case 'entities': return 'Manage Entities';
      case 'settings': return 'Settings';
      case 'testapis': return 'FBR Test APIs';
      default: return 'FBR Digital Invoices';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'invoicing': return <Home />;
      case 'entities': return <Entities />;
      case 'testapis': return <TestApis />;
      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Application settings will be implemented here.</p>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
        <main className="flex-1 overflow-y-auto p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}