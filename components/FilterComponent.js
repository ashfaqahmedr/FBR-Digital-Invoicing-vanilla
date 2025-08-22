/**
 * Reusable Filter Component
 * Handles search input, dropdown filters, date range filters, and pagination controls
 * 
 * @class FilterComponent
 */
class FilterComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      dataType: options.dataType || 'data',
      filters: options.filters || {},
      searchPlaceholder: options.searchPlaceholder || 'Search...',
      showSearch: options.showSearch !== false,
      showPagination: options.showPagination !== false,
      paginationOptions: options.paginationOptions || ['1', '10', '20', '50', '100', 'all'],
      defaultPerPage: options.defaultPerPage || '20',
      onFilterChange: options.onFilterChange || null,
      containerClass: options.containerClass || 'filters-section',
      formRowClass: options.formRowClass || 'form-row',
      ...options
    };
    
    this.currentFilters = {};
    this.render();
  }

  /**
   * Render the filter component HTML
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`FilterComponent: Container with ID '${this.containerId}' not found`);
      return;
    }

    const filterHTML = `
      <div class="filter-component ${this.options.containerClass}">
        <div class="${this.options.formRowClass}" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
          ${this.generateSearchInput()}
          ${this.generateFilterDropdowns()}
          ${this.generateDateRangeFilter()}
          ${this.generatePaginationSelect()}
          ${this.generateActionButtons()}
        </div>
        ${this.generateCustomDateRange()}
      </div>
    `;

    container.innerHTML = filterHTML;
    this.attachEventListeners();
  }

  /**
   * Generate search input HTML
   */
  generateSearchInput() {
    if (!this.options.showSearch) return '';
    
    return `
      <div class="form-group" style="width: 300px;">
        <div class="search-box" style="position: relative; display: flex; align-items: center;">
          <i class="fas fa-search" style="position: absolute; left: 10px; z-index: 1; color: #666;"></i>
          <input type="text" 
                 id="${this.options.dataType}Search" 
                 class="form-control filter-search"
                 placeholder="${this.options.searchPlaceholder}" 
                 style="padding-left: 35px; width: 100%; height: 38px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
    `;
  }

  /**
   * Generate filter dropdown HTML based on configuration
   */
  generateFilterDropdowns() {
    if (!this.options.filters || Object.keys(this.options.filters).length === 0) return '';
    
    return Object.entries(this.options.filters).map(([filterKey, filterConfig]) => {
      const options = filterConfig.options || [];
      const label = filterConfig.label || filterKey;
      const width = filterConfig.width || 'auto';
      
      return `
        <div class="form-group" style="flex: 1; min-width: ${width};">
          <select id="${this.options.dataType}${filterKey}Filter" class="form-control filter-dropdown" data-filter="${filterKey}">
            <option value="all">All ${label}</option>
            ${options.map(option => {
              const value = typeof option === 'object' ? option.value : option;
              const display = typeof option === 'object' ? option.label : option;
              return `<option value="${value}">${display}</option>`;
            }).join('')}
          </select>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate date range filter if configured
   */
  generateDateRangeFilter() {
    if (!this.options.showDateFilter) return '';
    
    return `
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <select id="${this.options.dataType}DateFilter" class="form-control filter-dropdown" data-filter="date">
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
    `;
  }

  /**
   * Generate pagination select dropdown
   */
  generatePaginationSelect() {
    if (!this.options.showPagination) return '';
    
    return `
      <div class="form-group" style="flex: 0 0 auto; min-width: 100px;">
        <select id="${this.options.dataType}PerPage" class="form-control filter-pagination">
          ${this.options.paginationOptions.map(option => `
            <option value="${option}" ${option === this.options.defaultPerPage ? 'selected' : ''}>${option === 'all' ? 'All' : option}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Generate action buttons (e.g., Add, Refresh)
   */
  generateActionButtons() {
    if (!this.options.actionButtons) return '';
    
    return `
      <div class="form-group" style="flex: 0 0 auto;">
        ${this.options.actionButtons.map(button => `
          <button class="${button.class || 'btn btn-primary'}" 
                  id="${button.id}" 
                  ${button.onclick ? `onclick="${button.onclick}"` : ''}
                  style="${button.style || 'margin-left: 10px;'}">
            ${button.icon ? `<i class="${button.icon}"></i>` : ''} ${button.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate custom date range inputs (initially hidden)
   */
  generateCustomDateRange() {
    if (!this.options.showDateFilter) return '';
    
    return `
      <div id="${this.options.dataType}CustomDateRange" class="form-row" style="display: none; margin-top: 10px;">
        <div class="form-group">
          <input type="date" id="${this.options.dataType}DateFrom" class="form-control">
        </div>
        <div style="padding: 0 10px; line-height: 38px;">to</div>
        <div class="form-group">
          <input type="date" id="${this.options.dataType}DateTo" class="form-control">
        </div>
        <div class="form-group">
          <button class="btn btn-primary" id="${this.options.dataType}ApplyDateFilter">
            <i class="fas fa-check"></i> Apply
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for all filter elements
   */
  attachEventListeners() {
    const container = document.getElementById(this.containerId);
    
    // Search input listener with debounce
    const searchInput = container.querySelector('.filter-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentFilters.search = searchInput.value;
        this.triggerFilterChange();
      }, 300));
    }

    // Dropdown filter listeners
    const dropdowns = container.querySelectorAll('.filter-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('change', (e) => {
        const filterKey = e.target.getAttribute('data-filter');
        this.currentFilters[filterKey] = e.target.value;
        
        // Handle date filter special case
        if (filterKey === 'date' && e.target.value === 'custom') {
          this.showCustomDateRange();
        } else if (filterKey === 'date') {
          this.hideCustomDateRange();
          this.triggerFilterChange();
        } else {
          this.triggerFilterChange();
        }
      });
    });

    // Pagination listener
    const paginationSelect = container.querySelector('.filter-pagination');
    if (paginationSelect) {
      paginationSelect.addEventListener('change', (e) => {
        this.currentFilters.perPage = e.target.value;
        this.triggerFilterChange();
      });
    }

    // Custom date range apply button
    const applyDateBtn = container.querySelector(`#${this.options.dataType}ApplyDateFilter`);
    if (applyDateBtn) {
      applyDateBtn.addEventListener('click', () => {
        const dateFrom = container.querySelector(`#${this.options.dataType}DateFrom`).value;
        const dateTo = container.querySelector(`#${this.options.dataType}DateTo`).value;
        this.currentFilters.dateFrom = dateFrom;
        this.currentFilters.dateTo = dateTo;
        this.triggerFilterChange();
      });
    }
  }

  /**
   * Show custom date range inputs
   */
  showCustomDateRange() {
    const customDateRange = document.getElementById(`${this.options.dataType}CustomDateRange`);
    if (customDateRange) {
      customDateRange.style.display = 'flex';
    }
  }

  /**
   * Hide custom date range inputs
   */
  hideCustomDateRange() {
    const customDateRange = document.getElementById(`${this.options.dataType}CustomDateRange`);
    if (customDateRange) {
      customDateRange.style.display = 'none';
    }
  }

  /**
   * Trigger filter change callback
   */
  triggerFilterChange() {
    if (this.options.onFilterChange && typeof this.options.onFilterChange === 'function') {
      this.options.onFilterChange(this.currentFilters);
    }
  }

  /**
   * Get current filter values
   */
  getFilters() {
    return { ...this.currentFilters };
  }

  /**
   * Set filter values programmatically
   */
  setFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.updateUI();
  }

  /**
   * Update UI elements to match current filter values
   */
  updateUI() {
    const container = document.getElementById(this.containerId);
    
    Object.entries(this.currentFilters).forEach(([key, value]) => {
      const element = container.querySelector(`#${this.options.dataType}${key}` || `#${this.options.dataType}${key}Filter`);
      if (element) {
        element.value = value;
      }
    });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {};
    const container = document.getElementById(this.containerId);
    
    // Reset all inputs and selects
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      } else if (input.tagName === 'SELECT') {
        input.value = 'all';
      }
    });
    
    this.hideCustomDateRange();
    this.triggerFilterChange();
  }

  /**
   * Debounce function for search input
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Update filter options dynamically
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}

/**
 * Factory function to create filter components easily
 * 
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {FilterComponent} - New FilterComponent instance
 */
function createFilterComponent(containerId, options = {}) {
  return new FilterComponent(containerId, options);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterComponent, createFilterComponent };
}

// Global access
window.FilterComponent = FilterComponent;
window.createFilterComponent = createFilterComponent;