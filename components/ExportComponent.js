/**
 * Reusable Export Component
 * Handles CSV, Excel, JSON, and PDF export functionality for any data type
 * 
 * @class ExportComponent
 */
class ExportComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      dataType: options.dataType || 'data',
      displayName: options.displayName || 'Data',
      formats: options.formats || ['json', 'excel', 'pdf'],
      customExportFunction: options.customExportFunction || null,
      buttonClass: options.buttonClass || 'btn btn-primary',
      dropdownClass: options.dropdownClass || 'dropdown-menu',
      ...options
    };
    
    this.render();
  }

  /**
   * Render the export component HTML
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`ExportComponent: Container with ID '${this.containerId}' not found`);
      return;
    }

    const exportHTML = `
      <div class="export-component">
        <div class="dropdown" style="display: inline-block;">
          <button class="${this.options.buttonClass} dropdown-toggle" 
                  type="button" 
                  id="export${this.options.dataType}Btn" 
                  data-toggle="dropdown"
                  aria-haspopup="true" 
                  aria-expanded="false">
            <i class="fas fa-download"></i> Export ${this.options.displayName}
          </button>
          <div class="${this.options.dropdownClass}" aria-labelledby="export${this.options.dataType}Btn">
            ${this.generateFormatOptions()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = exportHTML;
    this.attachEventListeners();
  }

  /**
   * Generate format options based on available formats
   */
  generateFormatOptions() {
    const formatIcons = {
      json: 'fas fa-file-code',
      excel: 'fas fa-file-excel', 
      csv: 'fas fa-file-csv',
      pdf: 'fas fa-file-pdf'
    };

    const formatLabels = {
      json: 'JSON',
      excel: 'Excel (CSV)',
      csv: 'CSV', 
      pdf: 'PDF'
    };

    return this.options.formats.map(format => `
      <a class="dropdown-item export-option" 
         href="#" 
         data-format="${format}"
         data-type="${this.options.dataType}">
        <i class="${formatIcons[format] || 'fas fa-file'}"></i> ${formatLabels[format] || format.toUpperCase()}
      </a>
    `).join('');
  }

  /**
   * Attach event listeners for export options
   */
  attachEventListeners() {
    const container = document.getElementById(this.containerId);
    const exportOptions = container.querySelectorAll('.export-option');
    
    exportOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const format = e.currentTarget.getAttribute('data-format');
        const dataType = e.currentTarget.getAttribute('data-type');
        this.handleExport(dataType, format);
      });
    });
  }

  /**
   * Handle export functionality
   */
  async handleExport(dataType, format) {
    try {
      // Use custom export function if provided
      if (this.options.customExportFunction) {
        await this.options.customExportFunction(dataType, format);
        return;
      }

      // Use the global exportData function (existing functionality)
      if (typeof window.exportData === 'function') {
        await window.exportData(dataType, format);
      } else {
        console.error('ExportComponent: No export function available');
        this.showToast('error', 'Export Failed', 'Export functionality not available');
      }
    } catch (error) {
      console.error('ExportComponent: Export error:', error);
      this.showToast('error', 'Export Failed', error.message || 'Failed to export data');
    }
  }

  /**
   * Show toast notification (fallback if global showToast not available)
   */
  showToast(type, title, message) {
    if (typeof window.showToast === 'function') {
      window.showToast(type, title, message);
    } else {
      // Fallback alert
      alert(`${title}: ${message}`);
    }
  }

  /**
   * Update export options dynamically
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }

  /**
   * Enable/disable specific export formats
   */
  setFormats(formats) {
    this.options.formats = formats;
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
 * Factory function to create export components easily
 * 
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {ExportComponent} - New ExportComponent instance
 */
function createExportComponent(containerId, options = {}) {
  return new ExportComponent(containerId, options);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportComponent, createExportComponent };
}

// Global access
window.ExportComponent = ExportComponent;
window.createExportComponent = createExportComponent;