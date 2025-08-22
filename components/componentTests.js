/**
 * Component Testing Script
 * Tests the functionality of all reusable components
 */

// Test data for components
const testData = {
  invoices: [
    {
      id: 1,
      dated: '2024-01-15',
      invoiceRefNo: 'INV-001',
      buyerBusinessName: 'Test Buyer 1',
      totalAmount: 1500.00,
      status: 'paid'
    },
    {
      id: 2,
      dated: '2024-01-16',
      invoiceRefNo: 'INV-002',
      buyerBusinessName: 'Test Buyer 2',
      totalAmount: 2500.00,
      status: 'draft'
    }
  ],
  products: [
    {
      id: 1,
      hsCode: '1234.5678',
      productName: 'Test Product 1',
      productType: 'Goods',
      uom: 'KG',
      purchaseRate: 100.00,
      saleRate: 150.00,
      taxRate: 17,
      openingStock: 50,
      status: 'Active'
    },
    {
      id: 2,
      hsCode: '9876.5432',
      productName: 'Test Product 2',
      productType: 'Services',
      uom: 'HOUR',
      purchaseRate: 200.00,
      saleRate: 300.00,
      taxRate: 17,
      openingStock: 0,
      status: 'Active'
    }
  ],
  sellers: [
    {
      ntn: '1234567890123',
      businessName: 'Test Seller 1',
      province: 'Punjab',
      registrationStatus: 'Active',
      registrationType: 'Registered'
    },
    {
      ntn: '9876543210987',
      businessName: 'Test Seller 2',
      province: 'Sindh',
      registrationStatus: 'Active',
      registrationType: 'Registered'
    }
  ],
  buyers: [
    {
      ntn: '1111222233334',
      businessName: 'Test Buyer 1',
      province: 'Punjab',
      registrationType: 'Registered',
      registrationStatus: 'Active'
    },
    {
      ntn: '5555666677778',
      businessName: 'Test Buyer 2',
      province: 'KPK',
      registrationType: 'Unregistered',
      registrationStatus: 'Active'
    }
  ]
};

/**
 * Test ExportComponent
 */
function testExportComponent() {
  console.log('Testing ExportComponent...');
  
  try {
    // Create test container
    const container = document.createElement('div');
    container.id = 'testExportContainer';
    document.body.appendChild(container);
    
    // Test component creation
    const exportComponent = new ExportComponent('testExportContainer', {
      dataType: 'test',
      displayName: 'Test Data',
      formats: ['json', 'excel', 'pdf']
    });
    
    // Verify component was created
    const exportButton = container.querySelector('.export-component button');
    if (exportButton) {
      console.log('✓ ExportComponent created successfully');
      console.log('✓ Export button found:', exportButton.textContent);
    } else {
      console.error('✗ ExportComponent creation failed');
    }
    
    // Test format options
    const formatOptions = container.querySelectorAll('.dropdown-item');
    if (formatOptions.length === 3) {
      console.log('✓ All export formats available:', formatOptions.length);
    } else {
      console.error('✗ Export formats missing:', formatOptions.length);
    }
    
    // Cleanup
    exportComponent.destroy();
    document.body.removeChild(container);
    
  } catch (error) {
    console.error('✗ ExportComponent test failed:', error);
  }
}

/**
 * Test FilterComponent
 */
function testFilterComponent() {
  console.log('Testing FilterComponent...');
  
  try {
    // Create test container
    const container = document.createElement('div');
    container.id = 'testFilterContainer';
    document.body.appendChild(container);
    
    // Test component creation
    const filterComponent = new FilterComponent('testFilterContainer', {
      dataType: 'test',
      filters: {
        status: {
          label: 'Status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      },
      onFilterChange: (filters) => {
        console.log('✓ Filter change callback triggered:', filters);
      }
    });
    
    // Verify component was created
    const searchInput = container.querySelector('.filter-search');
    const statusFilter = container.querySelector('[data-filter="status"]');
    const paginationSelect = container.querySelector('.filter-pagination');
    
    if (searchInput && statusFilter && paginationSelect) {
      console.log('✓ FilterComponent created successfully');
      console.log('✓ Search input found');
      console.log('✓ Status filter found');
      console.log('✓ Pagination select found');
    } else {
      console.error('✗ FilterComponent elements missing');
    }
    
    // Test filter methods
    filterComponent.setFilters({ status: 'active', search: 'test' });
    const currentFilters = filterComponent.getFilters();
    if (currentFilters.status === 'active' && currentFilters.search === 'test') {
      console.log('✓ Filter set/get methods working');
    } else {
      console.error('✗ Filter methods failed');
    }
    
    // Cleanup
    filterComponent.destroy();
    document.body.removeChild(container);
    
  } catch (error) {
    console.error('✗ FilterComponent test failed:', error);
  }
}

/**
 * Test TableComponent
 */
function testTableComponent() {
  console.log('Testing TableComponent...');
  
  try {
    // Create test container
    const container = document.createElement('div');
    container.id = 'testTableContainer';
    document.body.appendChild(container);
    
    // Test component creation
    const tableComponent = new TableComponent('testTableContainer', {
      dataType: 'test',
      displayName: 'Test Table',
      dataSource: () => Promise.resolve(testData.products),
      columns: [
        {
          key: 'productName',
          label: 'Product Name',
          sortable: true
        },
        {
          key: 'saleRate',
          label: 'Sale Rate',
          type: 'currency',
          sortable: true
        },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          sortable: true
        }
      ],
      filters: {
        Type: {
          label: 'Types',
          options: [
            { value: 'Goods', label: 'Goods' },
            { value: 'Services', label: 'Services' }
          ]
        }
      },
      customRowActions: [
        {
          text: 'Test',
          icon: 'fas fa-test',
          class: 'btn btn-sm btn-info',
          onclick: 'testAction'
        }
      ]
    });
    
    // Wait for component to load data
    setTimeout(() => {
      // Verify component was created
      const tableElement = container.querySelector('.items-table');
      const filterSection = container.querySelector('.filter-component');
      const paginationSection = container.querySelector('.pagination-container');
      
      if (tableElement && filterSection && paginationSection) {
        console.log('✓ TableComponent created successfully');
        console.log('✓ Table element found');
        console.log('✓ Filter section found');
        console.log('✓ Pagination section found');
        
        // Check table headers
        const headers = tableElement.querySelectorAll('th');
        if (headers.length >= 3) {
          console.log('✓ Table headers created:', headers.length);
        }
        
        // Check table rows
        const rows = tableElement.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          console.log('✓ Table data loaded:', rows.length, 'rows');
        } else {
          console.warn('⚠ No table data loaded');
        }
        
      } else {
        console.error('✗ TableComponent elements missing');
      }
      
      // Cleanup
      tableComponent.destroy();
      document.body.removeChild(container);
      
    }, 1000);
    
  } catch (error) {
    console.error('✗ TableComponent test failed:', error);
  }
}

/**
 * Test table configurations
 */
function testTableConfigs() {
  console.log('Testing table configurations...');
  
  try {
    // Check if configurations exist
    if (window.tableConfigs) {
      const configs = ['invoices', 'products', 'sellers', 'buyers'];
      let allConfigsValid = true;
      
      configs.forEach(configName => {
        const config = window.tableConfigs[configName];
        if (config && config.dataType && config.columns && config.columns.length > 0) {
          console.log(`✓ ${configName} configuration valid`);
        } else {
          console.error(`✗ ${configName} configuration invalid`);
          allConfigsValid = false;
        }
      });
      
      if (allConfigsValid) {
        console.log('✓ All table configurations are valid');
      }
    } else {
      console.error('✗ Table configurations not found');
    }
    
  } catch (error) {
    console.error('✗ Table configuration test failed:', error);
  }
}

/**
 * Test component initialization
 */
function testComponentInitialization() {
  console.log('Testing component initialization...');
  
  try {
    // Check if initialization functions exist
    if (typeof window.initializeTableComponents === 'function') {
      console.log('✓ initializeTableComponents function available');
    } else {
      console.error('✗ initializeTableComponents function missing');
    }
    
    if (typeof window.refreshTable === 'function') {
      console.log('✓ refreshTable function available');
    } else {
      console.error('✗ refreshTable function missing');
    }
    
    if (typeof window.refreshAllTables === 'function') {
      console.log('✓ refreshAllTables function available');
    } else {
      console.error('✗ refreshAllTables function missing');
    }
    
    // Check if table instances object exists
    if (typeof window.tableInstances === 'object') {
      console.log('✓ tableInstances object available');
    } else {
      console.error('✗ tableInstances object missing');
    }
    
  } catch (error) {
    console.error('✗ Component initialization test failed:', error);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('=== Component Testing Started ===');
  
  // Test individual components
  testExportComponent();
  testFilterComponent();
  testTableComponent();
  
  // Test configurations
  testTableConfigs();
  
  // Test initialization
  testComponentInitialization();
  
  console.log('=== Component Testing Completed ===');
}

/**
 * Mock functions for testing
 */
window.testAction = function(id) {
  console.log('Test action called with ID:', id);
};

// Global test functions
window.runComponentTests = runAllTests;
window.testExportComponent = testExportComponent;
window.testFilterComponent = testFilterComponent;
window.testTableComponent = testTableComponent;
window.testTableConfigs = testTableConfigs;
window.testComponentInitialization = testComponentInitialization;

// Auto-run tests if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Run tests after page load
  setTimeout(runAllTests, 2000);
}

console.log('Component testing functions loaded. Run window.runComponentTests() to test all components.');