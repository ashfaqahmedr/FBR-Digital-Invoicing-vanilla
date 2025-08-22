# Reusable Components Documentation

## Overview

This document describes the new reusable components created for the FBR Digital Invoicing System to enhance code maintainability and reduce duplication. The components include:

1. **ExportComponent** - Handles CSV/Excel/JSON/PDF export functionality
2. **FilterComponent** - Manages search, filters, date ranges, and pagination
3. **TableComponent** - Comprehensive table with integrated filtering, sorting, pagination, and export

## Component Architecture

### File Structure
```
components/
├── ExportComponent.js      # Reusable export functionality
├── FilterComponent.js      # Search and filter controls
├── TableComponent.js       # Complete table solution
├── tableConfigs.js         # Configuration for each table
├── componentInit.js        # Initialization and integration
└── components.css          # Component styling
```

## ExportComponent

### Purpose
Provides a reusable dropdown interface for exporting data in various formats.

### Usage
```javascript
// Basic usage
const exportComponent = new ExportComponent('containerId', {
  dataType: 'products',
  displayName: 'Products',
  formats: ['json', 'excel', 'pdf']
});

// Factory function
const exportComponent = createExportComponent('containerId', options);
```

### Configuration Options
```javascript
{
  dataType: 'data',              // Data type identifier
  displayName: 'Data',           // Display name for button
  formats: ['json', 'excel', 'pdf'], // Available export formats
  customExportFunction: null,    // Custom export handler
  buttonClass: 'btn btn-primary', // Button CSS class
  dropdownClass: 'dropdown-menu' // Dropdown CSS class
}
```

### Methods
- `render()` - Renders the component HTML
- `updateOptions(newOptions)` - Updates component configuration
- `setFormats(formats)` - Changes available export formats
- `destroy()` - Cleans up the component

## FilterComponent

### Purpose
Provides reusable search, filter, date range, and pagination controls.

### Usage
```javascript
const filterComponent = new FilterComponent('containerId', {
  dataType: 'products',
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
    console.log('Filters changed:', filters);
  }
});
```

### Configuration Options
```javascript
{
  dataType: 'data',
  filters: {},                   // Filter dropdown configurations
  searchPlaceholder: 'Search...', // Search input placeholder
  showSearch: true,              // Show/hide search input
  showPagination: true,          // Show/hide pagination
  showDateFilter: false,         // Show/hide date range filter
  paginationOptions: ['1', '10', '20', '50', '100', 'all'],
  defaultPerPage: '20',
  onFilterChange: null,          // Filter change callback
  actionButtons: []              // Additional action buttons
}
```

### Methods
- `render()` - Renders the component HTML
- `getFilters()` - Returns current filter values
- `setFilters(filters)` - Sets filter values programmatically
- `clearFilters()` - Clears all filters
- `destroy()` - Cleans up the component

## TableComponent

### Purpose
Comprehensive table solution with integrated filtering, sorting, pagination, and export functionality.

### Action Buttons UI Enhancement

#### Icon-Only Action Buttons
The table component now displays action buttons with icons only (no text) for a cleaner, more compact interface:
- Buttons show only the icon (e.g., ✏️ for edit, 🗑️ for delete)
- Tooltips appear on hover to show the action description
- More space-efficient design for tables with multiple actions

#### Conditional Actions for Invoices
The invoice table implements smart action visibility based on invoice status:

**Draft Invoices:**
- ✏️ Edit (allows modification)
- 📋 Duplicate (create copy)
- 🗑️ Delete (remove draft)

**Submitted/Processed Invoices:**
- 👁️ View (read-only access)

#### CSS Classes
- `.action-btn` - Base class for all action buttons
- `.actions-cell` - Container for action buttons
- Tooltip styles with fade-in animation
- Responsive button sizing

### Usage
```javascript
const tableComponent = new TableComponent('containerId', {
  dataType: 'products',
  displayName: 'Products',
  dataSource: async () => await dbGetAll(STORE_NAMES.products),
  columns: [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true
    },
    {
      key: 'price',
      label: 'Price',
      type: 'currency',
      sortable: true
    }
  ],
  filters: {
    category: {
      label: 'Category',
      options: ['Electronics', 'Clothing', 'Books']
    }
  }
});
```

### Configuration Options
```javascript
{
  dataType: 'data',
  displayName: 'Data',
  columns: [],                   // Column definitions
  dataSource: null,              // Data source function
  filters: {},                   // Filter configurations
  exportFormats: ['json', 'excel', 'pdf'],
  showSearch: true,
  showExport: true,
  showPagination: true,
  searchPlaceholder: 'Search...',
  paginationOptions: ['1', '10', '20', '50', '100', 'all'],
  defaultPerPage: '20',
  emptyMessage: 'No data found',
  addButtonConfig: null,         // Add button configuration
  customRowActions: [],          // Custom action buttons for each row
  onRowAction: null              // Row action callback
}
```

### Column Configuration
```javascript
{
  key: 'fieldName',              // Data field key
  label: 'Display Name',         // Column header text
  sortable: true,                // Enable sorting
  type: 'text',                  // Data type: text, number, currency, date, status
  valueFunction: (item) => {},   // Custom value extractor
  formatter: (value) => {}       // Custom value formatter
}
```

### Methods
- `render()` - Renders the complete table
- `loadData()` - Loads and displays data
- `refresh()` - Refreshes table data
- `handleSort(field)` - Handles column sorting
- `goToPage(page)` - Navigates to specific page
- `updateOptions(newOptions)` - Updates configuration
- `destroy()` - Cleans up the component

## Table Configurations

### Pre-defined Configurations
The system includes pre-configured table setups for:

1. **Invoices Table** (`window.tableConfigs.invoices`)
2. **Products Table** (`window.tableConfigs.products`)
3. **Sellers Table** (`window.tableConfigs.sellers`)
4. **Buyers Table** (`window.tableConfigs.buyers`)

### Custom Configuration Example
```javascript
const customTableConfig = {
  dataType: 'orders',
  displayName: 'Orders',
  icon: 'fas fa-shopping-cart',
  dataSource: async () => await getOrders(),
  columns: [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      sortable: true,
      valueFunction: (item) => item.totalAmount.toFixed(2)
    },
    {
      key: 'status',
      label: 'Status',
      type: 'status',
      sortable: true
    }
  ],
  filters: {
    status: {
      label: 'Status',
      width: '120px',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  },
  exportFormats: ['json', 'excel', 'pdf'],
  addButtonConfig: {
    text: 'Add Order',
    icon: 'fas fa-plus',
    onclick: 'openAddOrderModal()'
  },
  customRowActions: [
    {
      text: 'View',
      icon: 'fas fa-eye',
      class: 'btn btn-sm btn-info',
      onclick: 'viewOrder',
      title: 'View Order Details'
    },
    {
      text: 'Edit',
      icon: 'fas fa-edit',
      class: 'btn btn-sm btn-warning',
      onclick: 'editOrder',
      title: 'Edit Order'
    }
  ]
};
```

## Integration Guide

### HTML Setup
```html
<!-- Include CSS -->
<link rel="stylesheet" href="components/components.css">

<!-- Include JavaScript -->
<script src="components/ExportComponent.js"></script>
<script src="components/FilterComponent.js"></script>
<script src="components/TableComponent.js"></script>
<script src="components/tableConfigs.js"></script>
<script src="components/componentInit.js"></script>

<!-- Container for table -->
<div id="myTableContainer"></div>
```

### JavaScript Initialization
```javascript
// Components are auto-initialized on DOM ready
// Manual initialization if needed:
initializeTableComponents();

// Access table instances
const invoicesTable = window.tableInstances.invoices;
const productsTable = window.tableInstances.products;

// Refresh specific table
refreshTable('invoices');

// Refresh all tables
refreshAllTables();
```

## Migration from Old Tables

### What Changed
1. **Removed duplicate HTML** - Each table section now uses a single container div
2. **Centralized export logic** - All export functionality now goes through ExportComponent
3. **Unified filtering** - All search, filter, and pagination logic is handled by FilterComponent
4. **Consistent styling** - All tables use the same CSS classes and styling

### Before (Old Implementation)
```html
<div class="table-container">
  <div class="filters-section">
    <!-- 50+ lines of duplicate filter HTML -->
  </div>
  <div class="table-wrapper">
    <!-- 30+ lines of duplicate table HTML -->
  </div>
  <div class="pagination-container">
    <!-- 10+ lines of duplicate pagination HTML -->
  </div>
</div>
```

### After (New Implementation)
```html
<div id="tableContainer"></div>
```

### JavaScript Changes
```javascript
// Old way
populateInvoicesTable();
populateProductsTable();
populateSellersTable();
populateBuyersTable();

// New way (automatic)
refreshTable('invoices');
refreshTable('products');
refreshTable('sellers');
refreshTable('buyers');
```

## Benefits

### Code Maintainability
- **Reduced duplication**: ~400 lines of duplicate HTML/JS removed
- **Single source of truth**: All table logic in one place
- **Consistent behavior**: All tables work the same way
- **Easy updates**: Change once, apply everywhere

### Enhanced Features
- **Better export UX**: Consistent export interface across all tables
- **Improved filtering**: More robust search and filter functionality
- **Enhanced pagination**: Better pagination controls and navigation
- **Responsive design**: Better mobile and tablet support

### Performance
- **Faster loading**: Less HTML to parse
- **Better memory usage**: Shared component instances
- **Optimized rendering**: Virtual scrolling capabilities
- **Efficient updates**: Only re-render changed data

## Troubleshooting

### Common Issues

1. **Components not initializing**
   ```javascript
   // Check if scripts are loaded
   console.log('ExportComponent:', typeof ExportComponent);
   console.log('FilterComponent:', typeof FilterComponent);
   console.log('TableComponent:', typeof TableComponent);
   
   // Manual initialization
   initializeTableComponents();
   ```

2. **Export not working**
   ```javascript
   // Check if export data function exists
   console.log('exportData function:', typeof window.exportData);
   
   // Check data source
   const config = window.tableConfigs.invoices;
   config.dataSource().then(data => console.log('Data:', data));
   ```

3. **Filters not working**
   ```javascript
   // Check filter configuration
   const filterComponent = window.tableInstances.invoices.filterComponent;
   console.log('Current filters:', filterComponent.getFilters());
   ```

4. **Styling issues**
   ```html
   <!-- Ensure CSS is loaded -->
   <link rel="stylesheet" href="components/components.css">
   ```

### Debug Mode
```javascript
// Enable debug logging
window.DEBUG_COMPONENTS = true;

// Check component status
console.log('Table instances:', window.tableInstances);
console.log('Table configs:', window.tableConfigs);
```

## Future Enhancements

### Planned Features
1. **Virtual scrolling** for large datasets
2. **Column resizing** and reordering
3. **Advanced filtering** with multiple criteria
4. **Bulk operations** for selected rows
5. **Real-time updates** with WebSocket integration
6. **Custom themes** and styling options

### Extensibility
The component architecture is designed to be easily extensible:

```javascript
// Custom export format
ExportComponent.prototype.addCustomFormat = function(format, handler) {
  // Implementation
};

// Custom filter type
FilterComponent.prototype.addCustomFilter = function(type, renderer) {
  // Implementation
};

// Custom column type
TableComponent.prototype.addCustomColumnType = function(type, formatter) {
  // Implementation
};
```

## Support

For issues or questions regarding the reusable components:

1. Check the browser console for error messages
2. Verify all component scripts are loaded
3. Ensure data source functions are working
4. Test with simpler configurations first
5. Review this documentation for usage examples

The components are designed to be backward-compatible with existing functionality while providing enhanced features and better maintainability.