/**
 * Comprehensive Table Component
 * Integrates search, filters, pagination, sorting, and export functionality
 * 
 * @class TableComponent
 */
class TableComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      dataType: options.dataType || 'data',
      displayName: options.displayName || 'Data',
      columns: options.columns || [],
      dataSource: options.dataSource || null, // Function that returns data
      filters: options.filters || {},
      exportFormats: options.exportFormats || ['json', 'excel', 'pdf'],
      showSearch: options.showSearch !== false,
      showExport: options.showExport !== false,
      showPagination: options.showPagination !== false,
      searchPlaceholder: options.searchPlaceholder || `Search ${options.displayName || 'data'}...`,
      paginationOptions: options.paginationOptions || ['1', '10', '20', '50', '100', 'all'],
      defaultPerPage: options.defaultPerPage || '20',
      emptyMessage: options.emptyMessage || 'No data found',
      addButtonConfig: options.addButtonConfig || null,
      tableClass: options.tableClass || 'items-table',
      containerClass: options.containerClass || 'table-container',
      onRowAction: options.onRowAction || null,
      customRowActions: options.customRowActions || [],
      ...options
    };
    
    this.currentPage = 1;
    this.currentFilters = {};
    this.sortField = null;
    this.sortDirection = 'asc';
    this.filterComponent = null;
    this.exportComponent = null;
    
    this.render();
  }

  /**
   * Render the complete table component
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`TableComponent: Container with ID '${this.containerId}' not found`);
      return;
    }

    const tableHTML = `
      <div class="table-component">
        <div class="card">
          <div class="card-header">
            <h2><i class="${this.options.icon || 'fas fa-table'}"></i> ${this.options.displayName}</h2>
          </div>
          
          <div class="${this.options.containerClass}">
            <!-- Filters Section -->
            <div id="${this.containerId}_filters"></div>
            
            <!-- Table Section -->
            <div class="table-wrapper">
              <table class="${this.options.tableClass}" id="${this.containerId}_table">
                <thead>
                  <tr>
                    ${this.generateTableHeaders()}
                  </tr>
                </thead>
                <tbody id="${this.containerId}_tbody">
                  <!-- Data will be populated here -->
                </tbody>
              </table>
            </div>
            
            <!-- Pagination Section -->
            <div class="pagination-container">
              <div class="pagination-info" id="${this.containerId}_pagination_info">Showing 0 of 0 items</div>
              <div class="pagination-controls" id="${this.containerId}_pagination_controls">
                <!-- Pagination buttons will be added here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = tableHTML;
    this.initializeComponents();
    this.loadData();
  }

  /**
   * Generate table headers with sorting capability
   */
  generateTableHeaders() {
    const headers = this.options.columns.map(column => {
      const sortable = column.sortable !== false;
      const sortClass = sortable ? 'style="cursor: pointer;"' : '';
      const sortHandler = sortable ? `onclick="window.tableComponents['${this.containerId}'].handleSort('${column.key}')"` : '';
      const sortIcon = sortable ? `<i class="fas fa-sort" id="sort-${column.key}"></i>` : '';
      
      return `
        <th ${sortClass} ${sortHandler}>
          ${column.label} ${sortIcon}
        </th>
      `;
    });
    
    // Add actions column if needed
    if (this.options.customRowActions.length > 0 || this.options.onRowAction) {
      headers.push('<th>Actions</th>');
    }
    
    return headers.join('');
  }

  /**
   * Initialize filter and export components
   */
  initializeComponents() {
    // Prepare action buttons for filter component
    const actionButtons = [];
    
    if (this.options.addButtonConfig) {
      actionButtons.push({
        id: this.options.addButtonConfig.id || `add${this.options.dataType}Btn`,
        class: this.options.addButtonConfig.class || 'btn btn-success',
        icon: this.options.addButtonConfig.icon || 'fas fa-plus',
        text: this.options.addButtonConfig.text || `Add ${this.options.displayName}`,
        onclick: this.options.addButtonConfig.onclick || null
      });
    }

    // Add export component as button if enabled
    if (this.options.showExport) {
      actionButtons.push({
        id: `${this.containerId}_export_container`,
        class: 'export-container',
        text: '', // Will be populated by export component
        style: 'margin-left: 10px; display: inline-block;'
      });
    }

    // Initialize Filter Component
    this.filterComponent = new FilterComponent(`${this.containerId}_filters`, {
      dataType: this.options.dataType,
      filters: this.options.filters,
      searchPlaceholder: this.options.searchPlaceholder,
      showSearch: this.options.showSearch,
      showPagination: this.options.showPagination,
      showDateFilter: this.options.showDateFilter,
      paginationOptions: this.options.paginationOptions,
      defaultPerPage: this.options.defaultPerPage,
      actionButtons: actionButtons,
      onFilterChange: (filters) => this.handleFilterChange(filters)
    });

    // Initialize Export Component if enabled
    if (this.options.showExport) {
      setTimeout(() => {
        this.exportComponent = new ExportComponent(`${this.containerId}_export_container`, {
          dataType: this.options.dataType,
          displayName: this.options.displayName,
          formats: this.options.exportFormats,
          buttonClass: 'btn btn-primary btn-sm'
        });
      }, 100);
    }

    // Initialize table components registry
    if (!window.tableComponents) {
      window.tableComponents = {};
    }
    window.tableComponents[this.containerId] = this;
  }

  /**
   * Handle filter changes from FilterComponent
   */
  handleFilterChange(filters) {
    this.currentFilters = filters;
    this.currentPage = 1; // Reset to first page when filters change
    this.loadData();
  }

  /**
   * Handle column sorting
   */
  handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.updateSortIcons();
    this.loadData();
  }

  /**
   * Update sort icons in table headers
   */
  updateSortIcons() {
    // Reset all sort icons
    const sortIcons = document.querySelectorAll(`#${this.containerId}_table [id^="sort-"]`);
    sortIcons.forEach(icon => {
      icon.className = 'fas fa-sort';
    });

    // Update current sort icon
    if (this.sortField) {
      const currentIcon = document.getElementById(`sort-${this.sortField}`);
      if (currentIcon) {
        currentIcon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
      }
    }
  }

  /**
   * Load and display data
   */
  async loadData() {
    try {
      if (!this.options.dataSource) {
        console.error('TableComponent: No data source provided');
        return;
      }

      // Get raw data
      let data = [];
      if (typeof this.options.dataSource === 'function') {
        data = await this.options.dataSource();
      } else if (Array.isArray(this.options.dataSource)) {
        data = this.options.dataSource;
      }

      // Apply filters
      let filteredData = this.applyFilters(data);

      // Apply sorting
      if (this.sortField) {
        filteredData = this.applySorting(filteredData);
      }

      // Apply pagination
      const paginatedData = this.applyPagination(filteredData);

      // Render table rows
      this.renderTableRows(paginatedData.data);

      // Update pagination info
      this.updatePaginationInfo(paginatedData);

      // Render pagination controls
      this.renderPaginationControls(paginatedData);

    } catch (error) {
      console.error('TableComponent: Error loading data:', error);
      this.renderError('Failed to load data');
    }
  }

  /**
   * Apply filters to data
   */
  applyFilters(data) {
    return data.filter(item => {
      // Search filter
      if (this.currentFilters.search && this.currentFilters.search.trim()) {
        const searchTerm = this.currentFilters.search.toLowerCase();
        const matchesSearch = this.options.columns.some(column => {
          const value = this.getColumnValue(item, column);
          return value && value.toString().toLowerCase().includes(searchTerm);
        });
        if (!matchesSearch) return false;
      }

      // Dropdown filters
      for (const [filterKey, filterValue] of Object.entries(this.currentFilters)) {
        if (filterKey === 'search' || filterKey === 'perPage' || filterKey === 'dateFrom' || filterKey === 'dateTo') continue;
        if (filterValue && filterValue !== 'all') {
          const itemValue = item[filterKey];
          if (itemValue !== filterValue) return false;
        }
      }

      // Date range filter
      if (this.currentFilters.date && this.currentFilters.date !== 'all') {
        const dateField = this.options.dateField || 'date';
        const itemDate = new Date(item[dateField]);
        if (!this.isDateInRange(itemDate, this.currentFilters.date, this.currentFilters.dateFrom, this.currentFilters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if date is in specified range
   */
  isDateInRange(date, range, customFrom, customTo) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (range) {
      case 'today':
        return date.toDateString() === today.toDateString();
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return date >= last7Days && date <= today;
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        return date >= last30Days && date <= today;
      case 'thisMonth':
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      case 'lastMonth':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      case 'custom':
        if (customFrom && customTo) {
          const fromDate = new Date(customFrom);
          const toDate = new Date(customTo);
          return date >= fromDate && date <= toDate;
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Apply sorting to data
   */
  applySorting(data) {
    return data.sort((a, b) => {
      const column = this.options.columns.find(col => col.key === this.sortField);
      const aValue = this.getColumnValue(a, column);
      const bValue = this.getColumnValue(b, column);

      // Handle different data types
      let comparison = 0;
      if (column && column.type === 'number') {
        comparison = (parseFloat(aValue) || 0) - (parseFloat(bValue) || 0);
      } else if (column && column.type === 'date') {
        comparison = new Date(aValue) - new Date(bValue);
      } else {
        comparison = (aValue || '').toString().localeCompare((bValue || '').toString());
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply pagination to data
   */
  applyPagination(data) {
    const perPage = this.currentFilters.perPage || this.options.defaultPerPage;
    
    if (perPage === 'all') {
      return {
        data: data,
        totalPages: 1,
        currentPage: 1,
        totalItems: data.length,
        startIndex: 1,
        endIndex: data.length
      };
    }

    const itemsPerPage = parseInt(perPage);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (this.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: data.slice(startIndex, endIndex),
      totalPages: totalPages,
      currentPage: this.currentPage,
      totalItems: data.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, data.length)
    };
  }

  /**
   * Get row actions based on item properties and configuration
   */
  getRowActions(item) {
    // If there's a custom getRowActions function, use it
    if (this.options.getRowActions && typeof this.options.getRowActions === 'function') {
      return this.options.getRowActions(item);
    }
    
    // For invoices, apply conditional logic based on status
    if (this.options.dataType === 'invoices') {
      return this.getInvoiceActions(item);
    }
    
    // Default: return all configured actions
    return this.options.customRowActions;
  }

  /**
   * Get invoice-specific actions based on status
   */
  getInvoiceActions(invoice) {
    const actions = [];
    const status = invoice.status?.toLowerCase() || 'draft';
    const isDraft = status === 'draft';
    
    // View action - only for non-draft invoices
    if (!isDraft) {
      actions.push({
        text: 'View',
        icon: 'fas fa-eye',
        class: 'btn btn-sm btn-info',
        onclick: 'viewInvoice',
        title: 'View Invoice'
      });
    }
    
    // Edit action - only for draft invoices
    if (isDraft) {
      actions.push({
        text: 'Edit',
        icon: 'fas fa-edit',
        class: 'btn btn-sm btn-warning',
        onclick: 'editInvoice',
        title: 'Edit Invoice'
      });
      
      // Duplicate action - only for draft invoices
      actions.push({
        text: 'Duplicate',
        icon: 'fas fa-copy',
        class: 'btn btn-sm btn-secondary',
        onclick: 'duplicateInvoice',
        title: 'Duplicate Invoice'
      });
      
      // Delete action - only for draft invoices
      actions.push({
        text: 'Delete',
        icon: 'fas fa-trash',
        class: 'btn btn-sm btn-danger',
        onclick: 'deleteInvoice',
        title: 'Delete Invoice'
      });
    }
    
    return actions;
  }

  /**
   * Get column value from data item
   */
  getColumnValue(item, column) {
    if (!column) return '';
    
    if (column.valueFunction && typeof column.valueFunction === 'function') {
      return column.valueFunction(item);
    }
    
    return item[column.key] || '';
  }

  /**
   * Render table rows
   */
  renderTableRows(data) {
    const tbody = document.getElementById(`${this.containerId}_tbody`);
    
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.options.columns.length + (this.options.customRowActions.length > 0 ? 1 : 0)}" style="text-align: center;">
            ${this.options.emptyMessage}
            ${this.options.addButtonConfig ? `<br><button class="btn btn-primary" style="margin-top: 10px;" onclick="${this.options.addButtonConfig.onclick}">${this.options.addButtonConfig.text}</button>` : ''}
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => {
      const cells = this.options.columns.map(column => {
        const value = this.getColumnValue(item, column);
        const formattedValue = this.formatCellValue(value, column);
        return `<td>${formattedValue}</td>`;
      });

      // Add actions cell if needed
      if (this.options.customRowActions.length > 0) {
        const actions = this.getRowActions(item).map(action => {
          const actionId = item.id || item.ntn || Math.random().toString(36).substr(2, 9);
          return `<button class="${action.class || 'btn btn-sm btn-secondary'} action-btn" 
                          onclick="${action.onclick}('${actionId}')"
                          title="${action.title || action.text}"
                          data-tooltip="${action.title || action.text}">
                    ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                  </button>`;
        }).join(' ');
        cells.push(`<td class="actions-cell">${actions}</td>`);
      }

      return `<tr>${cells.join('')}</tr>`;
    }).join('');
  }

  /**
   * Format cell value based on column configuration
   */
  formatCellValue(value, column) {
    if (column.formatter && typeof column.formatter === 'function') {
      return column.formatter(value);
    }

    switch (column.type) {
      case 'currency':
        return `${parseFloat(value || 0).toFixed(2)} PKR`;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'status':
        return `<span class="status-badge status-${(value || '').toLowerCase()}">${value || ''}</span>`;
      default:
        return value || '';
    }
  }

  /**
   * Update pagination information
   */
  updatePaginationInfo(paginatedData) {
    const info = document.getElementById(`${this.containerId}_pagination_info`);
    if (info) {
      info.textContent = `Showing ${paginatedData.startIndex}-${paginatedData.endIndex} of ${paginatedData.totalItems} items`;
    }
  }

  /**
   * Render pagination controls
   */
  renderPaginationControls(paginatedData) {
    const controls = document.getElementById(`${this.containerId}_pagination_controls`);
    if (!controls || paginatedData.totalPages <= 1) {
      if (controls) controls.innerHTML = '';
      return;
    }

    const buttons = [];
    
    // Previous button
    buttons.push(`
      <button class="btn btn-sm btn-outline-primary ${this.currentPage === 1 ? 'disabled' : ''}" 
              onclick="window.tableComponents['${this.containerId}'].goToPage(${this.currentPage - 1})"
              ${this.currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Previous
      </button>
    `);

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(paginatedData.totalPages, this.currentPage + 2);

    if (startPage > 1) {
      buttons.push(`<button class="btn btn-sm btn-outline-primary" onclick="window.tableComponents['${this.containerId}'].goToPage(1)">1</button>`);
      if (startPage > 2) {
        buttons.push('<span class="pagination-ellipsis">...</span>');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(`
        <button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-outline-primary'}" 
                onclick="window.tableComponents['${this.containerId}'].goToPage(${i})">
          ${i}
        </button>
      `);
    }

    if (endPage < paginatedData.totalPages) {
      if (endPage < paginatedData.totalPages - 1) {
        buttons.push('<span class="pagination-ellipsis">...</span>');
      }
      buttons.push(`<button class="btn btn-sm btn-outline-primary" onclick="window.tableComponents['${this.containerId}'].goToPage(${paginatedData.totalPages})">${paginatedData.totalPages}</button>`);
    }

    // Next button
    buttons.push(`
      <button class="btn btn-sm btn-outline-primary ${this.currentPage === paginatedData.totalPages ? 'disabled' : ''}" 
              onclick="window.tableComponents['${this.containerId}'].goToPage(${this.currentPage + 1})"
              ${this.currentPage === paginatedData.totalPages ? 'disabled' : ''}>
        Next <i class="fas fa-chevron-right"></i>
      </button>
    `);

    controls.innerHTML = buttons.join('');
  }

  /**
   * Navigate to specific page
   */
  goToPage(page) {
    if (page < 1) return;
    this.currentPage = page;
    this.loadData();
  }

  /**
   * Render error message
   */
  renderError(message) {
    const tbody = document.getElementById(`${this.containerId}_tbody`);
    tbody.innerHTML = `
      <tr>
        <td colspan="${this.options.columns.length + 1}" style="text-align: center; color: #dc3545;">
          <i class="fas fa-exclamation-triangle"></i> ${message}
        </td>
      </tr>
    `;
  }

  /**
   * Refresh table data
   */
  refresh() {
    this.loadData();
  }

  /**
   * Update table options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    if (this.filterComponent) {
      this.filterComponent.destroy();
    }
    if (this.exportComponent) {
      this.exportComponent.destroy();
    }
    
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }

    // Remove from global registry
    if (window.tableComponents && window.tableComponents[this.containerId]) {
      delete window.tableComponents[this.containerId];
    }
  }
}

/**
 * Factory function to create table components easily
 * 
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {TableComponent} - New TableComponent instance
 */
function createTableComponent(containerId, options = {}) {
  return new TableComponent(containerId, options);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TableComponent, createTableComponent };
}

// Global access
window.TableComponent = TableComponent;
window.createTableComponent = createTableComponent;