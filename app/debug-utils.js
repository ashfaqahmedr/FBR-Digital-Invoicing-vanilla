/**
 * Debug Utilities for FRB Invoices App
 * Provides functions to log and analyze invoice data structure
 */

// Initialize IndexedDB connection
async function initDB() {
  if (window.db) return window.db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fbr_invoice_app', 2);
    
    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      window.db = event.target.result;
      resolve(window.db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('invoices')) {
        db.createObjectStore('invoices', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sellers')) {
        db.createObjectStore('sellers', { keyPath: 'ntn' });
      }
      if (!db.objectStoreNames.contains('buyers')) {
        db.createObjectStore('buyers', { keyPath: 'ntn' });
      }
    };
  });
}

// Helper function to get all records from a store
async function getAllFromStore(storeName) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => {
        console.error(`Error getting data from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error(`Error accessing ${storeName}:`, error);
    return [];
  }
}

// Log all invoices to console and save to a file
async function logAndSaveInvoices() {
  // Make sure the database is initialized
  await initDB();
  try {
    // Initialize DB if needed
    await initDB();
    
    // Get all invoices from IndexedDB
    const invoices = await getAllFromStore('invoices');
    
    if (!invoices || invoices.length === 0) {
      console.log('No invoices found in the database.');
      return [];
    }
    
    // Log to console with formatting
    console.group('=== ALL INVOICES ===');
    
    if (!invoices || invoices.length === 0) {
      console.log('No invoices found in the database.');
      console.groupEnd();
      return [];
    }
    
    try {
      console.table(invoices.map(invoice => ({
        id: invoice.id || 'N/A',
        invoiceRefNo: invoice.invoiceRefNo || 'N/A',
        invoiceDate: invoice.invoiceDate || invoice.dated || 'N/A',
        status: invoice.status || 'unknown',
        fbrInvoiceNumber: invoice.fbrInvoiceNumber || 'N/A',
        seller: invoice.sellerNTNCNIC || 'N/A',
        buyer: invoice.buyerNTNCNIC || 'N/A',
        totalAmount: invoice.totalAmount || 0,
        itemCount: Array.isArray(invoice.items) ? invoice.items.length : 0,
        hasValidation: !!invoice.validationResponse,
        hasPayload: !!invoice.invoicePayload
      })));
    } catch (e) {
      console.error('Error formatting invoices table:', e);
      console.log('Raw invoices data:', invoices);
    }
    
    // Log detailed view of each invoice
    console.group('DETAILED INVOICE DATA');
    invoices.forEach((invoice, index) => {
      console.group(`Invoice #${index + 1}: ${invoice.invoiceRefNo || 'No Ref'} (${invoice.status || 'no-status'})`);
      console.log('Basic Info:', {
        id: invoice.id,
        invoiceRefNo: invoice.invoiceRefNo,
        invoiceDate: invoice.invoiceDate || invoice.dated,
        status: invoice.status,
        fbrInvoiceNumber: invoice.fbrInvoiceNumber,
        sellerNTNCNIC: invoice.sellerNTNCNIC,
        buyerNTNCNIC: invoice.buyerNTNCNIC,
        currency: invoice.currency,
        invoiceType: invoice.invoiceType,
        grossAmount: invoice.grossAmount,
        salesTax: invoice.salesTax,
        totalAmount: invoice.totalAmount,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      });
      
      if (invoice.items && invoice.items.length > 0) {
        console.log('Items:', invoice.items);
      } else {
        console.warn('No items found in this invoice');
      }
      
      if (invoice.validationResponse) {
        console.log('Validation Response:', invoice.validationResponse);
      }
      
      console.groupEnd();
    });
    console.groupEnd(); // End DETAILED INVOICE DATA
    console.groupEnd(); // End ALL INVOICES
    
    // Save to file
    const dataStr = JSON.stringify({
      timestamp: new Date().toISOString(),
      count: invoices.length,
      invoices: invoices
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frb-invoices-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Successfully logged and saved ${invoices.length} invoices`);
    return invoices;
    
  } catch (error) {
    console.error('Error logging invoices:', error);
    showToast('error', 'Debug Error', 'Failed to log invoices: ' + (error.message || error));
    throw error;
  }
}

// Helper function to ensure consistent invoice structure
function normalizeInvoice(invoice) {
  if (!invoice) return null;
  
  // Ensure required fields have defaults
  return {
    // Core identifiers
    id: invoice.id || `inv-${Date.now()}`,
    invoiceRefNo: invoice.invoiceRefNo || '',
    fbrInvoiceNumber: invoice.fbrInvoiceNumber || '',
    status: invoice.status || 'draft',
    
    // Dates
    invoiceDate: invoice.invoiceDate || invoice.dated || new Date().toISOString().split('T')[0],
    createdAt: invoice.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Parties
    sellerNTNCNIC: invoice.sellerNTNCNIC || '',
    buyerNTNCNIC: invoice.buyerNTNCNIC || '',
    
    // Financials
    currency: invoice.currency || 'PKR',
    invoiceType: invoice.invoiceType || 'Sale Invoice',
    scenarioId: invoice.scenarioId || '',
    
    // Items
    items: Array.isArray(invoice.items) 
      ? invoice.items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          hsCode: item.hsCode || '',
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 0,
          uom: item.uom || '',
          unitPrice: parseFloat(item.unitPrice) || 0,
          taxRate: parseFloat(item.taxRate) || 0,
          sroSchedule: item.sroSchedule || '',
          sroItem: item.sroItem || '',
          serviceTypeId: item.serviceTypeId || '',
          valueSalesExcludingST: parseFloat(item.valueSalesExcludingST) || 0,
          salesTax: parseFloat(item.salesTax) || 0,
          totalValues: parseFloat(item.totalValues) || 0,
          ...(item.valueSalesExcludingST === undefined && {
            // Calculate if not present
            valueSalesExcludingST: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
            salesTax: ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) * (parseFloat(item.taxRate) || 0)) / 100,
            totalValues: ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)) * (1 + (parseFloat(item.taxRate) || 0) / 100)
          })
        }))
      : [],
    
    // Calculated fields if not present
    grossAmount: invoice.grossAmount !== undefined 
      ? parseFloat(invoice.grossAmount) 
      : (Array.isArray(invoice.items) 
          ? invoice.items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0)
          : 0),
          
    salesTax: invoice.salesTax !== undefined
      ? parseFloat(invoice.salesTax)
      : (Array.isArray(invoice.items)
          ? invoice.items.reduce((sum, i) => {
              const itemValue = (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0);
              return sum + (itemValue * (parseFloat(i.taxRate) || 0) / 100);
            }, 0)
          : 0),
          
    totalAmount: invoice.totalAmount !== undefined
      ? parseFloat(invoice.totalAmount)
      : (Array.isArray(invoice.items)
          ? invoice.items.reduce((sum, i) => {
              const itemValue = (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0);
              const tax = itemValue * (parseFloat(i.taxRate) || 0) / 100;
              return sum + itemValue + tax;
            }, 0)
          : 0),
    
    // Metadata
    validationResponse: invoice.validationResponse || null,
    invoicePayload: invoice.invoicePayload || null,
    notes: invoice.notes || ''
  };
}

// Function to check invoice statuses in the database
async function checkInvoiceStatuses() {
  try {
    await initDB();
    const invoices = await getAllFromStore('invoices');
    
    console.group('=== INVOICE STATUS REPORT ===');
    
    if (!invoices || invoices.length === 0) {
      console.log('No invoices found in the database.');
      console.groupEnd();
      return [];
    }
    
    // Count invoices by status
    const statusCounts = invoices.reduce((acc, invoice) => {
      const status = invoice.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Invoice Status Summary:');
    console.table(statusCounts);
    
    // Find invoices without status 'submitted'
    const invalidInvoices = invoices.filter(invoice => invoice.status !== 'submitted');
    
    if (invalidInvoices.length > 0) {
      console.group('Invoices with issues:');
      invalidInvoices.forEach(invoice => {
        console.group(`Invoice ID: ${invoice.id || 'N/A'}`);
        console.log('Status:', invoice.status || 'missing');
        console.log('Invoice Ref:', invoice.invoiceRefNo || 'N/A');
        console.log('Date:', invoice.invoiceDate || invoice.dated || 'N/A');
        console.log('Amount:', invoice.totalAmount || 'N/A');
        console.groupEnd();
      });
      console.groupEnd();
    } else {
      console.log('All invoices have status="submitted"');
    }
    
    console.groupEnd();
    return invoices;
    
  } catch (error) {
    console.error('Error checking invoice statuses:', error);
    throw error;
  }
}

// Add to window for easy access from browser console
window.logAndSaveInvoices = logAndSaveInvoices;
window.normalizeInvoice = normalizeInvoice;
window.checkInvoiceStatuses = checkInvoiceStatuses;

// Initialize DB when the script loads and make functions available
(async function() {
  try {
    await initDB();
    console.log('Debug utilities initialized');
  } catch (error) {
    console.error('Failed to initialize debug utilities:', error);
  }
})();

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logAndSaveInvoices,
    normalizeInvoice,
    initDB,
    getAllFromStore
  };
}
