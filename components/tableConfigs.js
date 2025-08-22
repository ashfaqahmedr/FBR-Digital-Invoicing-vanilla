/**
 * Table Configurations for FBR Digital Invoices
 * Defines the configuration for each table component
 */

// Utility function for date formatting (fallback if main app function not available)
function safeFormatDate(dateValue) {
  if (!dateValue) return '';
  
  // Try to use the main app's formatDateForDisplay function if available
  if (typeof window.formatDateForDisplay === 'function') {
    return window.formatDateForDisplay(dateValue);
  }
  
  // Fallback formatting
  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateValue.toString();
  }
}

// Invoices Table Configuration
const invoicesTableConfig = {
  dataType: 'invoices',
  displayName: 'Invoices',
  icon: 'fas fa-file-invoice-dollar',
  dataSource: async () => {
    if (typeof window.dbGetAll !== 'function' || typeof window.STORE_NAMES !== 'object') {
      console.warn('Database functions not available for invoices');
      return [];
    }
    return await window.dbGetAll(window.STORE_NAMES.invoices);
  },
  columns: [
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      sortable: true,
      valueFunction: (item) => safeFormatDate(item.dated || item.invoiceDate)
    },
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
      valueFunction: (item) => item.invoiceRefNo || ''
    },
    {
      key: 'buyer',
      label: 'Buyer',
      sortable: true,
      valueFunction: (item) => item.buyerBusinessName || ''
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      sortable: true,
      valueFunction: (item) => (item.totalAmount || 0).toFixed(2)
    },
    {
      key: 'status',
      label: 'Status',
      type: 'status',
      sortable: true,
      valueFunction: (item) => item.status || 'draft'
    }
  ],
  filters: {
    status: {
      label: 'Status',
      width: '120px',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'paid', label: 'Paid' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  },
  searchPlaceholder: 'Search invoices...',
  showDateFilter: true,
  dateField: 'dated',
  exportFormats: ['json', 'excel', 'pdf'],
  addButtonConfig: {
    text: 'Add Invoice',
    icon: 'fas fa-plus',
    class: 'btn btn-success',
    onclick: 'switchToCreateInvoiceTab()'
  },
  customRowActions: [
    {
      text: 'View',
      icon: 'fas fa-eye',
      class: 'btn btn-sm btn-info',
      onclick: 'viewInvoice',
      title: 'View Invoice'
    },
    {
      text: 'Edit',
      icon: 'fas fa-edit',
      class: 'btn btn-sm btn-warning',
      onclick: 'editInvoice',
      title: 'Edit Invoice'
    },
    {
      text: 'Delete',
      icon: 'fas fa-trash',
      class: 'btn btn-sm btn-danger',
      onclick: 'deleteInvoice',
      title: 'Delete Invoice'
    }
  ],
  emptyMessage: 'No invoices found in record'
};

// Products Table Configuration
const productsTableConfig = {
  dataType: 'products',
  displayName: 'Products',
  icon: 'fas fa-box',
  dataSource: async () => {
    if (typeof window.dbGetAll !== 'function' || typeof window.STORE_NAMES !== 'object') {
      console.warn('Database functions not available for products');
      return [];
    }
    return await window.dbGetAll(window.STORE_NAMES.products);
  },
  columns: [
    {
      key: 'hsCode',
      label: 'HS Code',
      sortable: true
    },
    {
      key: 'productName',
      label: 'Product Name',
      sortable: true
    },
    {
      key: 'productType',
      label: 'Type',
      sortable: true
    },
    {
      key: 'uom',
      label: 'UoM',
      sortable: true
    },
    {
      key: 'purchaseRate',
      label: 'Purchase Rate',
      type: 'currency',
      sortable: true,
      valueFunction: (item) => (item.purchaseRate || 0).toFixed(2)
    },
    {
      key: 'saleRate',
      label: 'Sale Rate',
      type: 'currency',
      sortable: true,
      valueFunction: (item) => (item.saleRate || 0).toFixed(2)
    },
    {
      key: 'taxRate',
      label: 'Tax Rate',
      sortable: true,
      valueFunction: (item) => `${(item.taxRate || 0)}%`
    },
    {
      key: 'openingStock',
      label: 'Stock',
      type: 'number',
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
      width: '120px',
      options: [
        { value: 'Goods', label: 'Goods' },
        { value: 'Services', label: 'Services' }
      ]
    },
    Status: {
      label: 'Status',
      width: '120px',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    }
  },
  searchPlaceholder: 'Search products...',
  exportFormats: ['json', 'excel', 'pdf'],
  addButtonConfig: {
    text: 'Add Product',
    icon: 'fas fa-plus',
    class: 'btn btn-success',
    onclick: 'openAddProductModal()'
  },
  customRowActions: [
    {
      text: 'Edit',
      icon: 'fas fa-edit',
      class: 'btn btn-sm btn-warning',
      onclick: 'editProduct',
      title: 'Edit Product'
    },
    {
      text: 'Delete',
      icon: 'fas fa-trash',
      class: 'btn btn-sm btn-danger',
      onclick: 'deleteProduct',
      title: 'Delete Product'
    }
  ],
  emptyMessage: 'No products found in record'
};

// Sellers Table Configuration
const sellersTableConfig = {
  dataType: 'sellers',
  displayName: 'Sellers',
  icon: 'fas fa-user-tie',
  dataSource: async () => {
    if (typeof window.dbGetAll !== 'function' || typeof window.STORE_NAMES !== 'object') {
      console.warn('Database functions not available for sellers');
      return [];
    }
    return await window.dbGetAll(window.STORE_NAMES.sellers);
  },
  columns: [
    {
      key: 'ntn',
      label: 'NTN/CNIC',
      sortable: true
    },
    {
      key: 'businessName',
      label: 'Business Name',
      sortable: true
    },
    {
      key: 'province',
      label: 'Province',
      sortable: true
    },
    {
      key: 'registrationStatus',
      label: 'Status',
      type: 'status',
      sortable: true
    },
    {
      key: 'registrationType',
      label: 'Registration Type',
      sortable: true
    }
  ],
  filters: {
    province: {
      label: 'Provinces',
      width: '140px',
      options: [
        { value: 'Punjab', label: 'Punjab' },
        { value: 'Sindh', label: 'Sindh' },
        { value: 'KPK', label: 'KPK' },
        { value: 'Balochistan', label: 'Balochistan' },
        { value: 'Islamabad', label: 'Islamabad' }
      ]
    },
    Status: {
      label: 'Status',
      width: '120px',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    RegistrationStatus: {
      label: 'Registration Status',
      width: '180px',
      options: [
        { value: 'Registered', label: 'Registered' },
        { value: 'Unregistered', label: 'Unregistered' }
      ]
    }
  },
  searchPlaceholder: 'Search sellers...',
  exportFormats: ['json', 'excel', 'pdf'],
  addButtonConfig: {
    text: 'Add Seller',
    icon: 'fas fa-plus',
    class: 'btn btn-success',
    onclick: 'openAddSellerModal()'
  },
  customRowActions: [
    {
      text: 'Edit',
      icon: 'fas fa-edit',
      class: 'btn btn-sm btn-warning',
      onclick: 'editSeller',
      title: 'Edit Seller'
    },
    {
      text: 'Delete',
      icon: 'fas fa-trash',
      class: 'btn btn-sm btn-danger',
      onclick: 'deleteSeller',
      title: 'Delete Seller'
    }
  ],
  emptyMessage: 'No sellers found in record'
};

// Buyers Table Configuration
const buyersTableConfig = {
  dataType: 'buyers',
  displayName: 'Buyers',
  icon: 'fas fa-users',
  dataSource: async () => {
    if (typeof window.dbGetAll !== 'function' || typeof window.STORE_NAMES !== 'object') {
      console.warn('Database functions not available for buyers');
      return [];
    }
    return await window.dbGetAll(window.STORE_NAMES.buyers);
  },
  columns: [
    {
      key: 'ntn',
      label: 'NTN/CNIC',
      sortable: true
    },
    {
      key: 'businessName',
      label: 'Business Name',
      sortable: true
    },
    {
      key: 'province',
      label: 'Province',
      sortable: true
    },
    {
      key: 'registrationType',
      label: 'Registration Type',
      sortable: true
    },
    {
      key: 'registrationStatus',
      label: 'Status',
      type: 'status',
      sortable: true
    }
  ],
  filters: {
    province: {
      label: 'Provinces',
      width: '140px',
      options: [
        { value: 'Punjab', label: 'Punjab' },
        { value: 'Sindh', label: 'Sindh' },
        { value: 'KPK', label: 'KPK' },
        { value: 'Balochistan', label: 'Balochistan' },
        { value: 'Islamabad', label: 'Islamabad' }
      ]
    },
    RegType: {
      label: 'Registration Types',
      width: '180px',
      options: [
        { value: 'Registered', label: 'Registered' },
        { value: 'unregistered', label: 'Unregistered' }
      ]
    },
    Status: {
      label: 'Status',
      width: '120px',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    }
  },
  searchPlaceholder: 'Search buyers...',
  exportFormats: ['json', 'excel', 'pdf'],
  addButtonConfig: {
    text: 'Add Buyer',
    icon: 'fas fa-plus',
    class: 'btn btn-success',
    onclick: 'openAddBuyerModal()'
  },
  customRowActions: [
    {
      text: 'Edit',
      icon: 'fas fa-edit',
      class: 'btn btn-sm btn-warning',
      onclick: 'editBuyer',
      title: 'Edit Buyer'
    },
    {
      text: 'Delete',
      icon: 'fas fa-trash',
      class: 'btn btn-sm btn-danger',
      onclick: 'deleteBuyer',
      title: 'Delete Buyer'
    }
  ],
  emptyMessage: 'No buyers found in record'
};

// Export configurations for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    invoicesTableConfig,
    productsTableConfig,
    sellersTableConfig,
    buyersTableConfig
  };
}

// Global access
window.tableConfigs = {
  invoices: invoicesTableConfig,
  products: productsTableConfig,
  sellers: sellersTableConfig,
  buyers: buyersTableConfig
};