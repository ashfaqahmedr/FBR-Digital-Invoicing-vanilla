/**
 * Component Initialization Script
 * Initializes all table components with their respective configurations
 */

// Global table component instances
window.tableInstances = {};

/**
 * Fallback initialization when database functions are not available
 */
function fallbackInitialization() {
  console.warn('Running fallback initialization - limited functionality available');
  
  // Show warning message to user
  const containers = [
    'invoicesTableContainer',
    'productsTableContainer', 
    'sellersTableContainer',
    'buyersTableContainer'
  ];
  
  containers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
          <h3>Loading...</h3>
          <p>Database functions are not yet available. Please refresh the page if this persists.</p>
          <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
        </div>
      `;
    }
  });
  
  // Try to reinitialize after a longer delay
  setTimeout(() => {
    console.log('Retrying initialization after fallback...');
    waitForDatabase(() => {
      console.log('Database now available after fallback, reinitializing...');
      initializeTableComponents();
      setupNavigationIntegration();
      setupModalIntegration();
      setupFunctionOverrides();
    }, 20); // Shorter retry count
  }, 2000); // Wait 2 seconds
}

/**
 * Initialize all table components
 */
function initializeTableComponents() {
  console.log('Initializing table components...');

  // Initialize Invoices Table
  if (document.getElementById('invoicesTableContainer')) {
    try {
      window.tableInstances.invoices = new TableComponent('invoicesTableContainer', window.tableConfigs.invoices);
      console.log('✓ Invoices table component initialized');
    } catch (error) {
      console.error('✗ Failed to initialize invoices table:', error);
    }
  }

  // Initialize Products Table
  if (document.getElementById('productsTableContainer')) {
    try {
      window.tableInstances.products = new TableComponent('productsTableContainer', window.tableConfigs.products);
      console.log('✓ Products table component initialized');
    } catch (error) {
      console.error('✗ Failed to initialize products table:', error);
    }
  }

  // Initialize Sellers Table
  if (document.getElementById('sellersTableContainer')) {
    try {
      window.tableInstances.sellers = new TableComponent('sellersTableContainer', window.tableConfigs.sellers);
      console.log('✓ Sellers table component initialized');
    } catch (error) {
      console.error('✗ Failed to initialize sellers table:', error);
    }
  }

  // Initialize Buyers Table
  if (document.getElementById('buyersTableContainer')) {
    try {
      window.tableInstances.buyers = new TableComponent('buyersTableContainer', window.tableConfigs.buyers);
      console.log('✓ Buyers table component initialized');
    } catch (error) {
      console.error('✗ Failed to initialize buyers table:', error);
    }
  }

  console.log('Table components initialization complete');
}

/**
 * Refresh all table components
 */
function refreshAllTables() {
  Object.values(window.tableInstances).forEach(instance => {
    if (instance && typeof instance.refresh === 'function') {
      instance.refresh();
    }
  });
}

/**
 * Refresh specific table component
 */
function refreshTable(tableType) {
  if (window.tableInstances[tableType] && typeof window.tableInstances[tableType].refresh === 'function') {
    window.tableInstances[tableType].refresh();
  }
}

/**
 * Row action handlers for compatibility with existing functions
 */

// Store original functions before overriding
const originalActions = {
  editSeller: window.editSeller,
  deleteSeller: window.deleteSeller,
  editBuyer: window.editBuyer,
  deleteBuyer: window.deleteBuyer
};

// Invoice actions
window.viewInvoice = function(id) {
  console.log('View invoice:', id);
  // Add your existing view invoice logic here
  if (typeof window.openInvoicePreview === 'function') {
    window.openInvoicePreview(id);
  }
};

window.editInvoice = function(id) {
  console.log('Edit invoice:', id);
  // Add your existing edit invoice logic here
  if (typeof window.editInvoiceById === 'function') {
    window.editInvoiceById(id);
  }
};

window.duplicateInvoice = function(id) {
  console.log('Duplicate invoice:', id);
  // Use existing duplicate function
  if (typeof originalActions.duplicateInvoice === 'function') {
    originalActions.duplicateInvoice(id);
  } else if (typeof window.duplicateInvoice === 'function') {
    // Call the original function if it exists
    const originalDuplicate = window.duplicateInvoice;
    originalDuplicate(id);
  }
};

window.deleteInvoice = function(id) {
  console.log('Delete invoice:', id);
  if (confirm('Are you sure you want to delete this invoice?')) {
    // Add your existing delete invoice logic here
    if (typeof window.deleteInvoiceById === 'function') {
      window.deleteInvoiceById(id);
      refreshTable('invoices');
    }
  }
};

// Product actions
window.editProduct = function(id) {
  console.log('Edit product:', id);
  // Add your existing edit product logic here
  if (typeof window.openEditProductModal === 'function') {
    window.openEditProductModal(id);
  }
};

window.deleteProduct = function(id) {
  console.log('Delete product:', id);
  if (confirm('Are you sure you want to delete this product?')) {
    // Add your existing delete product logic here
    if (typeof window.deleteProductById === 'function') {
      window.deleteProductById(id);
      refreshTable('products');
    }
  }
};

// Seller actions - Use existing functions but add table refresh
if (originalActions.editSeller) {
  window.editSeller = function(id) {
    console.log('Edit seller:', id);
    originalActions.editSeller(id);
  };
}

if (originalActions.deleteSeller) {
  window.deleteSeller = function(id) {
    console.log('Delete seller:', id);
    originalActions.deleteSeller(id).then(() => {
      refreshTable('sellers');
    }).catch((error) => {
      console.error('Error deleting seller:', error);
      refreshTable('sellers'); // Refresh anyway to update state
    });
  };
}

// Buyer actions - Use existing functions but add table refresh
if (originalActions.editBuyer) {
  window.editBuyer = function(id) {
    console.log('Edit buyer:', id);
    originalActions.editBuyer(id);
  };
}

if (originalActions.deleteBuyer) {
  window.deleteBuyer = function(id) {
    console.log('Delete buyer:', id);
    originalActions.deleteBuyer(id).then(() => {
      refreshTable('buyers');
    }).catch((error) => {
      console.error('Error deleting buyer:', error);
      refreshTable('buyers'); // Refresh anyway to update state
    });
  };
}

/**
 * Navigation integration
 */
function setupNavigationIntegration() {
  // Listen for tab changes to refresh tables when they become visible
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      
      // Refresh table when tab becomes active
      setTimeout(() => {
        switch (tabId) {
          case 'invoices-tab':
            refreshTable('invoices');
            break;
          case 'products-tab':
            refreshTable('products');
            break;
          case 'sellers-tab':
            refreshTable('sellers');
            break;
          case 'buyers-tab':
            refreshTable('buyers');
            break;
        }
      }, 100);
    });
  });
}

/**
 * Modal integration for add/edit operations
 */
function setupModalIntegration() {
  // Product modal integration
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      if (typeof window.openAddProductModal === 'function') {
        window.openAddProductModal();
      }
    });
  }

  // Seller modal integration
  const addSellerBtn = document.getElementById('addSellerBtn');
  if (addSellerBtn) {
    addSellerBtn.addEventListener('click', () => {
      if (typeof window.openAddSellerModal === 'function') {
        window.openAddSellerModal();
      }
    });
  }

  // Buyer modal integration
  const addBuyerModalBtn = document.getElementById('addBuyerModalBtn');
  if (addBuyerModalBtn) {
    addBuyerModalBtn.addEventListener('click', () => {
      if (typeof window.openAddBuyerModal === 'function') {
        window.openAddBuyerModal();
      }
    });
  }
}

/**
 * Override existing table population functions to use new components
 */
function setupFunctionOverrides() {
  // Store original functions
  const originalFunctions = {
    populateInvoicesTable: window.populateInvoicesTable,
    populateProductsTable: window.populateProductsTable,
    populateSellersTable: window.populateSellersTable,
    populateBuyersTable: window.populateBuyersTable
  };

  // Override existing table population functions
  if (typeof window.populateInvoicesTable === 'function') {
    window.populateInvoicesTable = function() {
      console.log('Redirecting populateInvoicesTable to component');
      if (window.tableInstances.invoices) {
        window.tableInstances.invoices.refresh();
      } else {
        console.warn('Invoices table component not available, using original function');
        if (originalFunctions.populateInvoicesTable) {
          originalFunctions.populateInvoicesTable();
        }
      }
    };
  }

  if (typeof window.populateProductsTable === 'function') {
    window.populateProductsTable = function() {
      console.log('Redirecting populateProductsTable to component');
      if (window.tableInstances.products) {
        window.tableInstances.products.refresh();
      } else {
        console.warn('Products table component not available, using original function');
        if (originalFunctions.populateProductsTable) {
          originalFunctions.populateProductsTable();
        }
      }
    };
  }

  if (typeof window.populateSellersTable === 'function') {
    window.populateSellersTable = function() {
      console.log('Redirecting populateSellersTable to component');
      if (window.tableInstances.sellers) {
        window.tableInstances.sellers.refresh();
      } else {
        console.warn('Sellers table component not available, using original function');
        if (originalFunctions.populateSellersTable) {
          originalFunctions.populateSellersTable();
        }
      }
    };
  }

  if (typeof window.populateBuyersTable === 'function') {
    window.populateBuyersTable = function() {
      console.log('Redirecting populateBuyersTable to component');
      if (window.tableInstances.buyers) {
        window.tableInstances.buyers.refresh();
      } else {
        console.warn('Buyers table component not available, using original function');
        if (originalFunctions.populateBuyersTable) {
          originalFunctions.populateBuyersTable();
        }
      }
    };
  }

  // Store original functions for potential fallback
  window.originalTableFunctions = originalFunctions;
}

/**
 * Initialize dropdown functionality for export components
 */
function initializeDropdownSupport() {
  // Add simple dropdown functionality if Bootstrap is not available
  document.addEventListener('click', (e) => {
    // Close all dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });

    // Open clicked dropdown
    if (e.target.classList.contains('dropdown-toggle') || e.target.closest('.dropdown-toggle')) {
      e.preventDefault();
      const button = e.target.classList.contains('dropdown-toggle') ? e.target : e.target.closest('.dropdown-toggle');
      const menu = button.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        menu.classList.add('show');
      }
    }
  });

  // CSS for dropdown show state
  const style = document.createElement('style');
  style.textContent = `
    .dropdown-menu.show {
      display: block !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Check if database functions are available
 */
function isDatabaseReady() {
  const checks = {
    dbGetAll: typeof window.dbGetAll === 'function',
    STORE_NAMES: typeof window.STORE_NAMES === 'object' && window.STORE_NAMES !== null,
    exportData: typeof window.exportData === 'function',
    formatDateForDisplay: typeof window.formatDateForDisplay === 'function'
  };
  
  const allReady = Object.values(checks).every(Boolean);
  
  if (!allReady) {
    console.log('Database readiness check:', checks);
  }
  
  return allReady;
}

/**
 * Wait for database functions to be available
 */
function waitForDatabase(callback, maxAttempts = 100) {
  let attempts = 0;
  
  function checkDatabase() {
    attempts++;
    
    if (isDatabaseReady()) {
      console.log('✓ Database functions available, initializing components...');
      callback();
    } else if (attempts < maxAttempts) {
      console.log(`⏳ Waiting for database functions... (attempt ${attempts}/${maxAttempts})`);
      setTimeout(checkDatabase, 200); // Check every 200ms for more stability
    } else {
      console.error('✗ Database functions not available after maximum attempts');
      console.error('Missing functions:', {
        dbGetAll: typeof window.dbGetAll,
        STORE_NAMES: typeof window.STORE_NAMES,
        exportData: typeof window.exportData,
        formatDateForDisplay: typeof window.formatDateForDisplay
      });
      console.error('Please ensure app.js is loaded and exports are available');
      
      // Try to initialize with fallback
      console.warn('Attempting fallback initialization...');
      fallbackInitialization();
    }
  }
  
  checkDatabase();
}

/**
 * Main initialization function
 */
function initializeComponents() {
  console.log('Starting component initialization...');
  
  // Initialize dropdown support first
  initializeDropdownSupport();
  
  // Wait for database to be ready before initializing table components
  waitForDatabase(() => {
    try {
      console.log('Database ready, starting table initialization...');
      
      // Initialize table components
      initializeTableComponents();
      
      // Setup navigation integration
      setupNavigationIntegration();
      
      // Setup modal integration
      setupModalIntegration();
      
      // Setup function overrides (after components are ready)
      setupFunctionOverrides();
      
      console.log('Component initialization complete!');
      
      // Notify that components are ready
      window.dispatchEvent(new CustomEvent('componentsReady', { 
        detail: { 
          tableInstances: window.tableInstances 
        } 
      }));
      
    } catch (error) {
      console.error('Error during component initialization:', error);
      
      // Try fallback after a delay
      setTimeout(() => {
        console.log('Retrying component initialization after error...');
        fallbackInitialization();
      }, 1000);
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeComponents);
} else {
  // DOM is already ready
  initializeComponents();
}

// Export functions for global access
window.initializeTableComponents = initializeTableComponents;
window.refreshAllTables = refreshAllTables;
window.refreshTable = refreshTable;
window.initializeComponents = initializeComponents;