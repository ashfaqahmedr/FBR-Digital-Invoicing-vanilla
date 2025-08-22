// DOMPurify is loaded globally via CDN and helps prevent XSS attacks

// DOMPurify is a library that helps prevent XSS attacks by sanitizing HTML and preventing script injection

let hsCodes = []
let transactionTypes = []
let provinces = []
const uomData = []
const taxRates = []
let sroSchedules = []
const sroItems = {}
let items = []
let itemCounter = 0
let currentEditingSeller = null
let currentEditingBuyer = null
let lastSubmissionResponse = null
let invoicePayload = null
let currentEditingInvoice = null
let originalInvoiceState = null
let initialAppState = null
let grandTotal = 0

// === Custom Confirm Modal ===
function customConfirm(options) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const icon = document.getElementById('confirmIcon');
    const title = document.getElementById('confirmTitle');
    const subtitle = document.getElementById('confirmSubtitle');
    const message = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    // Set content
    title.textContent = options.title || 'Confirm Action';
    subtitle.textContent = options.subtitle || 'Are you sure you want to proceed?';
    message.textContent = options.message || 'This action cannot be undone.';
    
    // Set icon and button style based on type
    const type = options.type || 'warning';
    icon.className = `icon ${type}`;
    confirmBtn.className = `btn btn-confirm ${type === 'info' ? 'info' : ''}`;
    
    if (type === 'danger') {
      icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      confirmBtn.textContent = options.confirmText || 'Delete';
    } else if (type === 'info') {
      icon.innerHTML = '<i class="fas fa-info-circle"></i>';
      confirmBtn.textContent = options.confirmText || 'Confirm';
    } else {
      icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      confirmBtn.textContent = options.confirmText || 'Confirm';
    }
    
    cancelBtn.textContent = options.cancelText || 'Cancel';
    
    // Show modal
    modal.classList.add('show');
    
    // Handle clicks
    const handleConfirm = () => {
      modal.classList.remove('show');
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.classList.remove('show');
      cleanup();
      resolve(false);
    };
    
    const handleClickOutside = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
    
    // Add event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
  });
}

// Export functions for each table type
function exportInvoices(format) {
  if (typeof exportData === 'function') {
    exportData(STORE_NAMES.invoices, format);
  } else {
    console.warn('Export function not available');
  }
}

function exportProducts(format) {
  if (typeof exportData === 'function') {
    exportData(STORE_NAMES.products, format);
  } else {
    console.warn('Export function not available');
  }
}

function exportSellers(format) {
  if (typeof exportData === 'function') {
    exportData(STORE_NAMES.sellers, format);
  } else {
    console.warn('Export function not available');
  }
}

function exportBuyers(format) {
  if (typeof exportData === 'function') {
    exportData(STORE_NAMES.buyers, format);
  } else {
    console.warn('Export function not available');
  }
}

// Custom confirm functions for delete actions
async function confirmDeleteSeller(ntn) {
  const confirmed = await customConfirm({
    type: 'danger',
    title: 'Delete Seller',
    subtitle: 'Are you sure you want to delete this seller?',
    message: 'This action cannot be undone. All data associated with this seller will be permanently removed.',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    deleteSeller(ntn);
  }
}

async function confirmDeleteBuyer(ntn) {
  const confirmed = await customConfirm({
    type: 'danger',
    title: 'Delete Buyer',
    subtitle: 'Are you sure you want to delete this buyer?',
    message: 'This action cannot be undone. All data associated with this buyer will be permanently removed.',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    deleteBuyer(ntn);
  }
}

async function confirmDeleteProduct(id) {
  const confirmed = await customConfirm({
    type: 'danger',
    title: 'Delete Product',
    subtitle: 'Are you sure you want to delete this product?',
    message: 'This action cannot be undone. All data associated with this product will be permanently removed.',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    deleteProduct(id);
  }
}

async function confirmDeleteInvoice(id) {
  const confirmed = await customConfirm({
    type: 'danger',
    title: 'Delete Invoice',
    subtitle: 'Are you sure you want to delete this invoice?',
    message: 'This action cannot be undone. The invoice will be permanently removed from your records.',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    deleteInvoice(id);
  }
}

// Make functions globally available
window.confirmDeleteSeller = confirmDeleteSeller;
window.confirmDeleteBuyer = confirmDeleteBuyer;
window.confirmDeleteProduct = confirmDeleteProduct;
window.confirmDeleteInvoice = confirmDeleteInvoice;
window.exportInvoices = exportInvoices;
window.exportProducts = exportProducts;
window.exportSellers = exportSellers;
window.exportBuyers = exportBuyers;


// === IndexedDB Utility ===
const DB_NAME = 'fbr_invoice_app';
const DB_VERSION = 4;
const STORE_NAMES = {
  sellers: 'sellers',
  buyers: 'buyers',
  invoices: 'invoices',
  products: 'products',
  preferences: 'preferences',
  logs: 'logs',
};

function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(e);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.sellers)) db.createObjectStore(STORE_NAMES.sellers, { keyPath: 'ntn' });
      if (!db.objectStoreNames.contains(STORE_NAMES.buyers)) db.createObjectStore(STORE_NAMES.buyers, { keyPath: 'ntn' });
      if (!db.objectStoreNames.contains(STORE_NAMES.invoices)) db.createObjectStore(STORE_NAMES.invoices, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(STORE_NAMES.preferences)) db.createObjectStore(STORE_NAMES.preferences, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORE_NAMES.products)) {
        const productsStore = db.createObjectStore(STORE_NAMES.products, { keyPath: 'id' });
        console.log('Products store created successfully');
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.logs)) db.createObjectStore(STORE_NAMES.logs, { keyPath: 'timestamp' });
    };
  });
}


async function dbGet(store, key) {
  try {
    const db = await openDB();
    // Check if store exists
    if (!db.objectStoreNames.contains(store)) {
      console.warn(`Store '${store}' does not exist, returning null`);
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.toString());
    });
  } catch (error) {
    console.warn(`Error accessing store '${store}':`, error);
    return null;
  }
}

async function dbSet(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(new Error(`Failed to save to ${store}: ${e.target.error?.message || e}`));
  });
}

async function dbGetAll(store) {
  try {
    const db = await openDB();
    // Check if store exists
    if (!db.objectStoreNames.contains(store)) {
      console.warn(`Store '${store}' does not exist, returning empty array`);
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.toString());
    });
  } catch (error) {
    console.warn(`Error accessing store '${store}':`, error);
    return [];
  }
}

async function dbDelete(store, key) {
  try {
    const db = await openDB();
    // Check if store exists
    if (!db.objectStoreNames.contains(store)) {
      console.warn(`Store '${store}' does not exist, cannot delete data`);
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error.message);
    });
  } catch (error) {
    console.warn(`Error accessing store '${store}':`, error);
    return null;
  }
}

async function dbSetAll(store, items) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readwrite');
    const objectStore = tx.objectStore(store);
    
    // Clear existing data
    objectStore.clear();
    
    // Add all items
    items.forEach(item => {
      objectStore.put(item);
    });
    
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(new Error(`Failed to save all to ${store}: ${e.target.error?.message || e}`));
  });
}

// === Migrate localStorage data to IndexedDB on first load ===
async function migrateLocalStorageToIndexedDB() {
  const stores = [
    { key: 'fbrSellers', store: STORE_NAMES.sellers, default: typeof defaultSellers !== 'undefined' ? defaultSellers : [] },
    { key: 'fbrBuyers', store: STORE_NAMES.buyers, default: typeof defaultBuyers !== 'undefined' ? defaultBuyers : [] },
    { key: 'fbrInvoices', store: STORE_NAMES.invoices, default: [] },
    { key: 'fbrPreferences', store: STORE_NAMES.preferences, default: [] },
    { key: 'fbrProducts', store: STORE_NAMES.products, default: [] },
    { key: 'fbrLogs', store: STORE_NAMES.logs, default: [] },
  ];
  
  // Wait for DB to be ready
  await openDB();
  
  // Process stores sequentially to avoid race conditions
  for (const { key, store, default: defaultData } of stores) {
    try {
      const existing = await dbGetAll(store);
      if (!existing || existing.length === 0) {
        let data = [];
        // Try to migrate from localStorage first
        try {
          data = JSON.parse(localStorage.getItem(key) || "[]");
        } catch (e) {
          data = [];
        }
        // If no data in localStorage, use default
        if (!Array.isArray(data) || data.length === 0) {
          data = defaultData;
        }
        // Always ensure products store exists even if empty
        if (store === STORE_NAMES.products && (!data || data.length === 0)) {
          // Create empty products store to ensure it exists
          console.log('Creating empty products store');
        }
        if (Array.isArray(data) && data.length > 0) {
          // Save items sequentially to avoid transaction conflicts
          for (const item of data) {
            await dbSet(store, item);
          }
        }
        localStorage.removeItem(key); // Optionally clear old storage
      }
    } catch (error) {
      console.warn(`Failed to migrate data for store '${store}':`, error);
    }
  }
}


// Centralized DOM element references
const DOMElements = {
  modeToggle: document.getElementById("modeToggle"),
  sellerSelect: document.getElementById("sellerSelect"),
  buyerSelect: document.getElementById("buyerSelect"),
  invoiceType: document.getElementById("invoiceType"),
  invoiceDate: document.getElementById("invoiceDate"),
  currency: document.getElementById("currency"),
  invoiceRef: document.getElementById("invoiceRef"),
  scenarioId: document.getElementById("scenarioId"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  addItemBtn: document.getElementById("addItemBtn"),
  sellersTableBody: document.getElementById("sellersTableBody"),
  buyersTableBody: document.getElementById("buyersTableBody"),
  itemsBody: document.getElementById("itemsBody"),
  invoiceResult: document.getElementById("invoiceResult"),
  errorContent: document.getElementById("errorContent"),
  fbrInvoiceNumber: document.getElementById("fbrInvoiceNumber"),
  successResponseJson: document.getElementById("successResponseJson"),
  successResponseData: document.getElementById("successResponseData"),
  successModal: document.getElementById("successModal"),
   closeSuccessModal: document.getElementById("closeSuccessModal"),
  closeSuccessModalBtn: document.getElementById("closeSuccessModalBtn"),
  errorModal: document.getElementById("errorModal"),
  closeErrorModal: document.getElementById("closeErrorModal"),
  closeErrorModalBtn: document.getElementById("closeErrorModalBtn"),
  retrySubmissionBtn: document.getElementById("retrySubmissionBtn"),
  previewModal: document.getElementById("previewModal"),
  closePreviewModal: document.getElementById("closePreviewModal"),
  closePreviewModalBtn: document.getElementById("closePreviewModalBtn"),
  addInvoiceBtn: document.getElementById("addInvoiceBtn"),
  invoicesTableBody: document.getElementById("invoicesTableBody"),
  downloadPreviewBtn: document.getElementById("downloadPreviewBtn"),
  printPreviewBtn: document.getElementById("printPreviewBtn"),
  createDummyInvoiceBtn: document.getElementById("createDummyInvoiceBtn"),
  sellerNTN: document.getElementById("sellerNTN"),
  sellerBusinessName: document.getElementById("sellerBusinessName"),
  sellerBusinessActivity: document.getElementById("sellerBusinessActivity"),
  sellerSector: document.getElementById("sellerSector"),
  sellerProvince: document.getElementById("sellerProvince"),
  sellerAddress: document.getElementById("sellerAddress"),
  sellerSandboxToken: document.getElementById("sellerSandboxToken"),
  sellerProductionToken: document.getElementById("sellerProductionToken"),
  sellerRegStatus: document.getElementById("sellerRegStatus"),
  sellerRegType: document.getElementById("sellerRegType"),
  sellerLastSaleInvoiceId: document.getElementById("sellerLastSaleInvoiceId"),
  sellerLastDebitNoteId: document.getElementById("sellerLastDebitNoteId"),
  sellerModalTitle: document.getElementById("sellerModalTitle"),
  sellerModal: document.getElementById("sellerModal"),
  buyerNTN: document.getElementById("buyerNTN"),
  buyerBusinessName: document.getElementById("buyerBusinessName"),
  buyerProvince: document.getElementById("buyerProvince"),
  buyerAddress: document.getElementById("buyerAddress"),
  buyerRegType: document.getElementById("buyerRegType"),
  buyerStatus: document.getElementById("buyerStatus"),
  buyerModalTitle: document.getElementById("buyerModalTitle"),
  buyerModal: document.getElementById("buyerModal"),
  scenarioChips: document.getElementById("scenarioChips"),
  sellerScenarioIds: document.getElementById("sellerScenarioIds"),
  sellerScenarioSelect: document.getElementById("sellerScenarioSelect"),
  toastContainer: document.getElementById("toastContainer"),
  invoicePreview: document.getElementById("invoicePreview"),
  testApiBtn: document.getElementById("testApiBtn"),
  apiResult: document.getElementById("apiResult"),
  apiResultStatus: document.getElementById("apiResultStatus"),
  copyApiResponseBtn: document.getElementById("copyApiResponseBtn"),
  paramGroups: document.querySelectorAll(".param-group"),
};

// Initialize preview modal
const previewModal = document.getElementById("previewModal")
const closePreviewModal = document.getElementById("closePreviewModal")
const closePreviewModalBtn = document.getElementById("closePreviewModalBtn")
const downloadPreviewBtn = document.getElementById("downloadPreviewBtn")
const printPreviewBtn = document.getElementById("printPreviewBtn")
const invoicePreview = document.getElementById("invoicePreview")

// Add JSON view button to preview modal
const viewJsonBtn = document.createElement('button');
viewJsonBtn.className = 'btn btn-secondary';
viewJsonBtn.id = 'viewJsonBtn';
viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';

// Insert the button before the download button
const previewFooter = document.querySelector('#previewModal .modal-footer');
if (previewFooter) {
  // Insert at the beginning if there are children, otherwise just append
  if (previewFooter.firstElementChild) {
    previewFooter.insertBefore(viewJsonBtn, previewFooter.firstElementChild);
  } else {
    previewFooter.appendChild(viewJsonBtn);
  }
}

// Handle preview modal close
closePreviewModal.addEventListener("click", () => {
  previewModal.classList.remove("active")
  invoicePreview.innerHTML = ""
  // Reset JSON view button state
  viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';
  viewJsonBtn.classList.remove('active');
})

closePreviewModalBtn.addEventListener("click", () => {
  previewModal.classList.remove("active")
  invoicePreview.innerHTML = ""
  // Reset JSON view button state
  viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';
  viewJsonBtn.classList.remove('active');
})

// Toggle between JSON and HTML view
viewJsonBtn.addEventListener('click', () => {
  if (viewJsonBtn.classList.contains('active')) {
    // Switch back to HTML view
    generateInvoicePDF(window.currentInvoiceData, false, true);
    viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';
    viewJsonBtn.classList.remove('active');
  } else {
    // Show JSON view
    const invoiceData = {
      invoiceDetails: {
        invoiceNumber: window.currentInvoiceData?.invoiceNumber || 'Draft',
        date: window.currentInvoiceData?.dated || new Date().toISOString(),
        totalAmount: window.currentInvoiceData?.totalAmount || 0,
        status: window.currentInvoiceData?.status || 'draft'
      },
      items: window.currentInvoiceData?.invoicePayload?.items || [],
      validation: window.currentInvoiceData?.validationResponse || {},
      submission: window.currentInvoiceData?.submissionResponse || {}
    };
    
    invoicePreview.innerHTML = `<div style="padding: 20px;">
      <h3>Invoice Data (JSON View)</h3>
      <pre style="white-space: pre-wrap; word-wrap: break-word; background: #f8f9fa; padding: 15px; border-radius: 4px; max-height: 70vh; overflow-y: auto;">
${JSON.stringify(invoiceData, null, 2)}
      </pre>
    </div>`;
    
    viewJsonBtn.innerHTML = '<i class="fas fa-file-alt"></i> View Invoice';
    viewJsonBtn.classList.add('active');
  }
});

// Scenario data
const scenarioDescriptions = [
  { scenarioId: "SN001", description: "Goods at standard rate to registered buyers" },
  { scenarioId: "SN002", description: "Goods at standard rate to unregistered buyers" },
  { scenarioId: "SN003", description: "Sale of Steel (Melted and Re-Rolled)" },
  { scenarioId: "SN004", description: "Sale by Ship Breakers" },
  { scenarioId: "SN005", description: "Reduced rate sale" },
  { scenarioId: "SN006", description: "Exempt goods sale" },
  { scenarioId: "SN007", description: "Zero rated sale" },
  { scenarioId: "SN008", description: "Sale of 3rd schedule goods" },
  { scenarioId: "SN009", description: "Cotton Spinners purchase from Cotton Ginners" },
  { scenarioId: "SN010", description: "Mobile Operators adds Sale (Telecom Sector)" },
  { scenarioId: "SN011", description: "Toll Manufacturing sale by Steel sector" },
  { scenarioId: "SN012", description: "Sale of Petroleum products" },
  { scenarioId: "SN013", description: "Electricity Supply to Retailers" },
  { scenarioId: "SN014", description: "Sale of Gas to CNG stations" },
  { scenarioId: "SN015", description: "Sale of mobile phones" },
  { scenarioId: "SN016", description: "Processing / Conversion of Goods" },
  { scenarioId: "SN017", description: "Sale of Goods where FED is charged in ST mode" },
  { scenarioId: "SN018", description: "Sale of Services where FED is charged in ST mode" },
  { scenarioId: "SN019", description: "Sale of Services" },
  { scenarioId: "SN020", description: "Sale of Electric Vehicles" },
  { scenarioId: "SN021", description: "Sale of Cement / Concrete Block" },
  { scenarioId: "SN022", description: "Sale of Potassium Chlorate" },
  { scenarioId: "SN023", description: "Sale of CNG" },
  { scenarioId: "SN024", description: "Goods sold that are listed in SRO 297(1)/2023" },
  { scenarioId: "SN025", description: "Drugs sold at fixed ST rate under serial 81 of Eighth Schedule Table 1" },
  { scenarioId: "SN026", description: "Sale to End Consumer by retailers (Standard Rate)" },
  { scenarioId: "SN027", description: "Sale to End Consumer by retailers (3rd Schedule Goods)" },
  { scenarioId: "SN028", description: "Sale to End Consumer by retailers (Reduced Rate)" },
]

// Business Activity Sector Scenarios
const businessActivitySectorScenarios = [
  {
    businessActivity: "Manufacturer",
    sector: "All Other Sectors",
    scenarios: ["SN001", "SN002", "SN005", "SN006", "SN007", "SN015", "SN016", "SN017", "SN021", "SN022", "SN024"],
  },
  { businessActivity: "Manufacturer", sector: "Steel", scenarios: ["SN003", "SN004", "SN011"] },
  {
    businessActivity: "Manufacturer",
    sector: "FMCG",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN008",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Textile",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN009",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Telecom",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN010",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Petroleum",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN012",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Electricity Distribution",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN013",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Gas Distribution",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN014",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Services",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN018",
      "SN019",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Automobile",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN020",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "CNG Stations",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN023",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Pharmaceuticals",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN025",
    ],
  },
  {
    businessActivity: "Manufacturer",
    sector: "Wholesale / Retails",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN026",
      "SN027",
      "SN028",
      "SN008",
    ],
  },
  {
    businessActivity: "Importer",
    sector: "All Other Sectors",
    scenarios: ["SN001", "SN002", "SN005", "SN006", "SN007", "SN015", "SN016", "SN017", "SN021", "SN022", "SN024"],
  },
  {
    businessActivity: "Importer",
    sector: "Steel",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN003",
      "SN004",
      "SN011",
    ],
  },
  {
    businessActivity: "Importer",
    sector: "FMCG",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN008",
    ],
  },
  {
    businessActivity: "Retailer",
    sector: "All Other Sectors",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN026",
      "SN027",
      "SN028",
      "SN008",
    ],
  },
  { businessActivity: "Retailer", sector: "Steel", scenarios: ["SN003", "SN004", "SN011"] },
  { businessActivity: "Retailer", sector: "FMCG", scenarios: ["SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "Textile", scenarios: ["SN009", "SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "Telecom", scenarios: ["SN010", "SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "Petroleum", scenarios: ["SN012", "SN026", "SN027", "SN028", "SN008"] },
  {
    businessActivity: "Retailer",
    sector: "Electricity Distribution",
    scenarios: ["SN013", "SN026", "SN027", "SN028", "SN008"],
  },
  {
    businessActivity: "Retailer",
    sector: "Gas Distribution",
    scenarios: ["SN014", "SN026", "SN027", "SN028", "SN008"],
  },
  {
    businessActivity: "Retailer",
    sector: "Services",
    scenarios: ["SN018", "SN019", "SN026", "SN027", "SN028", "SN008"],
  },
  { businessActivity: "Retailer", sector: "Automobile", scenarios: ["SN020", "SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "CNG Stations", scenarios: ["SN023", "SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "Pharmaceuticals", scenarios: ["SN025", "SN026", "SN027", "SN028", "SN008"] },
  { businessActivity: "Retailer", sector: "Wholesale / Retails", scenarios: ["SN026", "SN027", "SN028", "SN008"] },
  {
    businessActivity: "Service Provider",
    sector: "All Other Sectors",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN018",
      "SN019",
    ],
  },
  { businessActivity: "Service Provider", sector: "Steel", scenarios: ["SN003", "SN004", "SN011", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "FMCG", scenarios: ["SN008", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Textile", scenarios: ["SN009", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Telecom", scenarios: ["SN010", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Petroleum", scenarios: ["SN012", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Electricity Distribution", scenarios: ["SN013", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Gas Distribution", scenarios: ["SN014", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Services", scenarios: ["SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Automobile", scenarios: ["SN020", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "CNG Stations", scenarios: ["SN023", "SN018", "SN019"] },
  { businessActivity: "Service Provider", sector: "Pharmaceuticals", scenarios: ["SN025", "SN018", "SN019"] },
  {
    businessActivity: "Service Provider",
    sector: "Wholesale / Retails",
    scenarios: ["SN026", "SN027", "SN028", "SN008", "SN018", "SN019"],
  },
  {
    businessActivity: "Other",
    sector: "All Other Sectors",
    scenarios: ["SN001", "SN002", "SN005", "SN006", "SN007", "SN015", "SN016", "SN017", "SN021", "SN022", "SN024"],
  },
  {
    businessActivity: "Other",
    sector: "Steel",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN003",
      "SN004",
      "SN011",
    ],
  },
  {
    businessActivity: "Other",
    sector: "FMCG",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN008",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Textile",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN009",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Telecom",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN010",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Petroleum",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN012",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Electricity Distribution",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN013",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Gas Distribution",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN014",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Services",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN018",
      "SN019",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Automobile",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN020",
    ],
  },
  {
    businessActivity: "Other",
    sector: "CNG Stations",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN023",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Pharmaceuticals",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN025",
    ],
  },
  {
    businessActivity: "Other",
    sector: "Wholesale / Retails",
    scenarios: [
      "SN001",
      "SN002",
      "SN005",
      "SN006",
      "SN007",
      "SN015",
      "SN016",
      "SN017",
      "SN021",
      "SN022",
      "SN024",
      "SN026",
      "SN027",
      "SN028",
      "SN008",
    ],
  },
]

// Default provinces fallback
const defaultProvinces = [
  { stateProvinceCode: 2, stateProvinceDesc: "BALOCHISTAN" },
  { stateProvinceCode: 4, stateProvinceDesc: "AZAD JAMMU AND KASHMIR" },
  { stateProvinceCode: 5, stateProvinceDesc: "CAPITAL TERRITORY" },
  { stateProvinceCode: 6, stateProvinceDesc: "KHYBER PAKHTUNKHWA" },
  { stateProvinceCode: 7, stateProvinceDesc: "PUNJAB" },
  { stateProvinceCode: 8, stateProvinceDesc: "SINDH" },
  { stateProvinceCode: 9, stateProvinceDesc: "GILGIT BALTISTAN" },
]

// API URLs with environment distinction
const API_URLS = {
  validate: {
    sandbox: "https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb",
    production: "https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata",
  },
  submit: {
    sandbox: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb",
    production: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata",
  },
  hsCodes: "https://gw.fbr.gov.pk/pdi/v1/itemdesccode",
  provinces: "https://gw.fbr.gov.pk/pdi/v1/provinces",
  transactionTypes: "https://gw.fbr.gov.pk/pdi/v1/transtypecode",
  uom: "https://gw.fbr.gov.pk/pdi/v1/uom",
  saleTypeToRate: "https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate",
  hsUom: "https://gw.fbr.gov.pk/pdi/v2/HS_UOM",
  doctypecode: "https://gw.fbr.gov.pk/pdi/v1/doctypecode",
  sroitemcode: "https://gw.fbr.gov.pk/pdi/v1/sroitemcode",
  SroSchedule: "https://gw.fbr.gov.pk/pdi/v1/SroSchedule",
  SROItem: "https://gw.fbr.gov.pk/pdi/v2/SROItem",
  statl: "https://gw.fbr.gov.pk/dist/v1/statl",
  getRegType: "https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type",
};


// Default data
const defaultSellers = [
  {
    id: "hussaini",
    businessName: "HUSSAINI LOGISTICS ENTERPRISES (PRIVATE) LIMITED",
    ntn: "7908224",
    address: "Rawalpindi",
    province: "SINDH",
    businessActivity: "Service Provider",
    sector: "Services",
    scenarioIds: ["SN018","SN019"],
    sandboxToken: "Bearer df9b1769-25e7-3557-9343-37bc5e882b29",
    productionToken: "Bearer df9b1769-25e7-3557-9343-37bc5e882b29",
    registrationStatus: "Active",
    registrationType: "Registered",
    lastSaleInvoiceId: 1,
    lastDebitNoteId: 1,
  },
  {
    id: "mtc",
    businessName: "SYED IMRAN HUSSAIN SHAH",
    ntn: "4420653123917",
    address: "Hyderabad",
    province: "SINDH",
    businessActivity: "Service Provider",
    sector: "Services",
    scenarioIds: ["SN018","SN019"],
    sandboxToken: "Bearer 4c001ca4-4d0e-3f95-9b04-aec2cad0e5f5",
    productionToken: "Bearer 4c001ca4-4d0e-3f95-9b04-aec2cad0e5f5",
    registrationStatus: "Active",
    registrationType: "Registered",
    lastSaleInvoiceId: 1,
    lastDebitNoteId: 1,
  },
]

const defaultBuyers = [
  {
    id: "continental",
    businessName: "CONTINENTAL BISCUITS LIMITED",
    ntn: "0710106",
    address: "Karachi",
    province: "SINDH",
    registrationType: "Registered",
    registrationStatus: "Active",
  },
  {
    id: "pso",
    businessName: "PAKISTAN STATE OIL COMPANY LIMITED",
    ntn: "0711554",
    address: "Karachi",
    province: "SINDH",
    registrationType: "Registered",
    registrationStatus: "Active",
  },
]

// Toast notification system
function showToast(type, title, message, duration = 5000) {
  const toastContainer = DOMElements.toastContainer
  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const iconMap = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  // Import DOMPurify for sanitizing HTML content
  // DOMPurify.sanitize() is used to sanitize potentially unsafe HTML content
  toast.innerHTML = `
    <i class="toast-icon ${iconMap[type]}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `

  toastContainer.appendChild(toast)

  // Show toast
  setTimeout(() => toast.classList.add("show"), 100)

  // Auto remove
  const autoRemove = setTimeout(() => {
    if (document.body.contains(toast)) {
      removeToast(toast)
    }
  }, duration)

  // Manual close
  toast.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(autoRemove)
    removeToast(toast)
  })
}

function removeToast(toast) {
  if (!toast || !document.body.contains(toast)) return;
  toast.classList.remove("show");
  setTimeout(() => toast.remove(), 300);
}

function showModalError(modalId, message) {
  const errorDiv = document.getElementById(`${modalId}Error`)
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.classList.add("show")
    setTimeout(() => errorDiv.classList.remove("show"), 5000)
  }
}

// Utility functions

// Unified function to get next invoice reference number
async function getNextInvoiceRefNumber(sellerNtn, invoiceType) {
  const prefix = invoiceType === "Sale Invoice" ? "SI" : "DN"
  
  // Get all invoices and filter by seller and type
  const invoices = await dbGetAll(STORE_NAMES.invoices)
  // console.log('All invoices:', invoices.map(inv => ({ id: inv.id, sellerNTN: inv.invoicePayload?.sellerNTNCNIC || inv.sellerNTNCNIC, type: inv.invoicePayload?.invoiceType || inv.invoiceType, ref: inv.invoicePayload?.invoiceRefNo || inv.invoiceRefNo })))
  
  const existingRefs = invoices
    .filter(inv => (inv.invoicePayload?.sellerNTNCNIC || inv.sellerNTNCNIC) === sellerNtn && (inv.invoicePayload?.invoiceType || inv.invoiceType) === invoiceType)
    .map(inv => inv.invoicePayload?.invoiceRefNo || inv.invoiceRefNo || "")
    .filter(ref => ref && ref.startsWith(prefix))
    .map(ref => {
      const numPart = ref.split("-")[1]
      // console.log('getNextInvoiceRefNumber - Ref:', ref, 'Num Part:', numPart)
      return numPart ? parseInt(numPart, 10) : 0
    })
    .sort((a, b) => b - a)
  
  // Get seller's stored ID
  const seller = await dbGet(STORE_NAMES.sellers, sellerNtn)
  const sellerStoredId = invoiceType === "Sale Invoice" ? 
    (seller?.lastSaleInvoiceId || 1) : (seller?.lastDebitNoteId || 1)
  
  // Get the highest number from both sources
  const highestFromInvoices = existingRefs[0] || 0
  const nextId = Math.max(highestFromInvoices, sellerStoredId || 0) + 1
  
  const returnRef = `${prefix}-${nextId.toString().padStart(4, "0")}`
  // console.log('getNextInvoiceRefNumber - Seller:', sellerNtn, 'Type:', invoiceType, 'Existing refs:', existingRefs, 'Highest from invoices:', highestFromInvoices, 'Seller stored:', sellerStoredId, 'Next ID:', nextId, 'Ref:', returnRef)
  return returnRef
}


// Update seller's invoice ID after successful submission
async function updateSellerInvoiceId(sellerNtn, invoiceType) {
  const seller = await dbGet(STORE_NAMES.sellers, sellerNtn)
  if (!seller) return
  
  // Get the current highest reference number and increment it
  const currentRef = await getNextInvoiceRefNumber(sellerNtn, invoiceType)
  const refNumber = currentRef.split('-')[1]
  const nextId = parseInt(refNumber, 10)
  
  if (invoiceType === "Sale Invoice") {
    seller.lastSaleInvoiceId = nextId
  } else {
    seller.lastDebitNoteId = nextId
  }
  await dbSet(STORE_NAMES.sellers, seller)
}

// Reset invoice reference number - called on app load, form reset, and after successful submission
async function resetInvoiceReference() {
  const sellerSelect = DOMElements.sellerSelect
  const invoiceRefField = DOMElements.invoiceRef

  if (!sellerSelect.value || !invoiceRefField) return

  const seller = await dbGet(STORE_NAMES.sellers, sellerSelect.value)
  if (seller) {
    // console.log('resetInvoiceReference - Seller data:', {
    //   ntn: seller.ntn,
    //   lastSaleInvoiceId: seller.lastSaleInvoiceId,
    //   lastDebitNoteId: seller.lastDebitNoteId
    // });
    
    const invoiceType = DOMElements.invoiceType.value || "Sale Invoice"
    // console.log('resetInvoiceReference - Invoice Type:', invoiceType);


    invoiceRefField.value = await getNextInvoiceRefNumber(seller.ntn, invoiceType)

    // console.log('resetInvoiceReference - New Invoice Ref:', invoiceRefField.value);
  }
}

// Reset to initial state
async function resetToInitialState() {
  // Clear editing state
  currentEditingInvoice = null;
  originalInvoiceState = null;
  
  // Reset form fields
  DOMElements.invoiceDate.value = getCurrentDate();
  DOMElements.invoiceType.value = "Sale Invoice";
  DOMElements.currency.value = "PKR";
  
  // Clear items array and reset counter
  items = [];
  itemCounter = 0;

  
  
  // Add only one default item
  await addNewItem();
  
  // Reset invoice reference
  await resetInvoiceReference();
  
  // Update UI
  updateEditStateUI(false);
  updateInvoiceTotal();
}



function ensureBearerToken(token) {
  if (!token) return ""
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`
}

function debounce(func, wait) {
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

// Import DOMPurify for sanitizing HTML
// DOMPurify is a library that sanitizes HTML and prevents XSS attacks
function formatResponse(response) {
  if (typeof response === "string") {
    try {
      const parsed = JSON.parse(response)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      if (response.includes("<html>") || response.includes("<!DOCTYPE")) {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = response
        return tempDiv.textContent || tempDiv.innerText || response
      }
      return response
    }
  }
  return JSON.stringify(response, null, 2)
}

// Get current date in specified format
function getCurrentDate(format = 'YYYY-MM-DD') {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    default:
      return `${year}-${month}-${day}`
  }
}

// Format date for API calls
function formatDateForAPI(dateString, format = 'DD-MMM-YYYY') {
  if (!dateString) return getCurrentDate('DD-MMM-YYYY')
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = date.getFullYear()
  
  switch (format) {
    case 'DD-MMM-YYYY':
      return `${day}-${month}-${year}`
    case 'YYYY-MM-DD':
      return dateString
    default:
      return `${day}-${month}-${year}`
  }
}

// Format date for display in DD-MMM-YYYY HH:MM AM/PM format
function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid date
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${day}-${month}-${year} ${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}


async function getSelectedSeller() {
  const sellerKey = DOMElements.sellerSelect.value
  return await dbGet(STORE_NAMES.sellers, sellerKey)
}

async function getSelectedBuyer() {
  const buyerKey = DOMElements.buyerSelect.value
  return await dbGet(STORE_NAMES.buyers, buyerKey)
}

// API functions

// Submit Invoice to FBR
async function submitInvoiceToFBR() {
  try {
    const { seller, buyer, invoicePayload } = await validateAndPrepareInvoice();
    const response = await submitInvoice(invoicePayload);
    await handleSubmissionResponse(response, seller, invoicePayload);
  } catch (e) {
    handleSubmissionError(e);
  }
}

async function validateAndPrepareInvoice() {
  const seller = await getSelectedSeller();
  const buyer = await getSelectedBuyer();
  if (!seller || !buyer) {
    throw new Error("Please select both seller and buyer.");
  }
  if (!items || items.length === 0) {
    throw new Error("Invoice must have at least one item.");
  }
  const invoicePayload = buildInvoicePayload(seller, buyer);
  return { seller, buyer, invoicePayload };
}

function buildInvoicePayload(seller, buyer) {
  return {
    invoiceType: DOMElements.invoiceType.value,
    invoiceDate: DOMElements.invoiceDate.value,
    sellerNTNCNIC: seller.ntn,
    sellerBusinessName: seller.businessName,
    sellerProvince: seller.province,
    sellerAddress: seller.address,
    buyerNTNCNIC: buyer.ntn,
    buyerBusinessName: buyer.businessName,
    buyerRegistrationType: buyer.registrationType,
    buyerProvince: buyer.province,
    buyerAddress: buyer.address,
    invoiceRefNo: DOMElements.invoiceRef.value,
    currency: DOMElements.currency.value,
    paymentMode: document.getElementById('paymentMode').value,
    scenarioId: DOMElements.scenarioId.value,
    items: items.map((item, idx) => ({
      itemSNo: (idx + 1).toString(),
      hsCode: item.hsCode,
      productDescription: item.description,
      rate: `${item.taxRate.toFixed(2)}%`,
      uoM: item.uom,
      quantity: item.quantity,
      valueSalesExcludingST: item.quantity * item.unitPrice,
      salesTaxApplicable: (item.quantity * item.unitPrice) * (item.taxRate / 100),
      salesTaxWithheldAtSource: 0,
      extraTax: item.extraTax || 0,
      furtherTax: item.furtherTax || 0,
      totalValues: (item.quantity * item.unitPrice) + ((item.quantity * item.unitPrice) * (item.taxRate / 100)) + (item.extraTax || 0) + (item.furtherTax || 0) - (item.discount || 0),
      sroScheduleNo: "",
      fedPayable: DOMElements.scenarioId.value === "SN018" ? 50 : 0,
      discount: item.discount || 0,
      saleType: item.saleType || "Services",
      sroItemSerialNo: "",
      fixedNotifiedValueOrRetailPrice: 0,
    })),
    grossAmount: items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0),
    salesTax: items.reduce((sum, i) => sum + ((i.quantity * i.unitPrice) * (i.taxRate / 100)), 0),
    totalAmount: items.reduce((sum, i) => sum + (i.quantity * i.unitPrice) + ((i.quantity * i.unitPrice) * (i.taxRate / 100)) + (i.extraTax || 0) + (i.furtherTax || 0) - (i.discount || 0), 0),
  };
}

async function submitInvoice(invoicePayload) {
  const isProduction = DOMElements.modeToggle.checked;
  const endpoint = isProduction ? API_URLS.submit.production : API_URLS.submit.sandbox;
  showToast("info", "Submitting Invoice", "Submitting invoice to FBR...");
  return await fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(invoicePayload),
  });
}

async function handleSubmissionResponse(response, seller, invoicePayload) {
  if (response && (response.status === "00" || response.statusCode === "00")) {
    await handleSuccessfulSubmission(response, seller, invoicePayload);
  } else {
    handleFailedSubmission(response);
  }
}

async function handleSuccessfulSubmission(response, seller, invoicePayload) {
  try {
    // Enrich the response with additional data
    const enrichedResponse = enrichResponseWithInvoiceData(response, invoicePayload);
    
    // Calculate total amount from line items
    const totalAmount = calculateTotalFromLineItems(invoicePayload.items);
    
    // Create or update the invoice in the database
    const invoiceData = {
      ...invoicePayload,
      id: currentEditingInvoice || Date.now().toString(),
      status: 'submitted',
      fbrInvoiceNumber: response.InvoiceNumber || response.invoiceNumber,
      dated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: totalAmount,
      validationResponse: response,
      invoicePayload: invoicePayload
    };

    // Save the invoice to the database
    await dbSet(STORE_NAMES.invoices, invoiceData);
    
    // Increment the invoice reference number for the seller
   
    
    // Store the invoice data for the success modal
    lastSubmissionResponse = invoiceData;
    
    // Display success modal with the response
    displaySuccessModal(enrichedResponse);
    
    // Update the invoices table
    await populateInvoicesTable();
    
  } catch (error) {
    console.error('Error handling successful submission:', error);
    showToast('error', 'Error', 'Failed to process successful submission: ' + (error.message || error));
  }
}

function enrichResponseWithInvoiceData(response, invoicePayload) {
  return {
    ...response,
    invoiceRefNo: invoicePayload.invoiceRefNo,
    sellerNTNCNIC: invoicePayload.sellerNTNCNIC,
    buyerNTNCNIC: invoicePayload.buyerNTNCNIC,
    items: invoicePayload.items,
    invoiceDate: invoicePayload.invoiceDate,
    invoiceType: invoicePayload.invoiceType,
    currency: invoicePayload.currency,
    totalAmount: invoicePayload.totalAmount,
    status: "submitted",
    fbrInvoiceNumber: response.invoiceNumber || response.invoiceRefNo,
  };
}



// Clean up success modal state
function cleanupSuccessModal() {
  const tableTab = document.getElementById('table-tab');
  const jsonTab = document.getElementById('json-tab');
  const toggleBtn = document.getElementById('toggleViewBtn');
  
  if (tableTab && jsonTab && toggleBtn) {
    // Remove all classes and styles
    tableTab.classList.remove('active');
    jsonTab.classList.remove('active');
    
    // Clear inline styles
    tableTab.removeAttribute('style');
    jsonTab.removeAttribute('style');
    
    // Reset button state
    toggleBtn.setAttribute('data-current', '');
    
    console.log('Success modal state cleaned up');
  }
}

// Debug function for success modal tabs
function debugSuccessModalTabs() {
  const tableTab = document.getElementById('table-tab');
  const jsonTab = document.getElementById('json-tab');
  const toggleBtn = document.getElementById('toggleViewBtn');
  const modal = document.getElementById('successModal');
  
  console.log('=== Success Modal Tab Debug ===');
  console.log('Modal active:', modal?.classList.contains('active'));
  console.log('Table tab element:', !!tableTab);
  console.log('JSON tab element:', !!jsonTab);
  console.log('Toggle button element:', !!toggleBtn);
  
  if (tableTab) {
    console.log('Table tab classes:', tableTab.classList.toString());
    console.log('Table tab style.display:', tableTab.style.display);
    console.log('Table tab computed display:', getComputedStyle(tableTab).display);
    console.log('Table tab visibility:', getComputedStyle(tableTab).visibility);
  }
  
  if (jsonTab) {
    console.log('JSON tab classes:', jsonTab.classList.toString());
    console.log('JSON tab style.display:', jsonTab.style.display);
    console.log('JSON tab computed display:', getComputedStyle(jsonTab).display);
    console.log('JSON tab visibility:', getComputedStyle(jsonTab).visibility);
  }
  
  if (toggleBtn) {
    console.log('Toggle button data-current:', toggleBtn.getAttribute('data-current'));
    console.log('Toggle button text:', toggleBtn.textContent.trim());
  }
  
  console.log('=== End Debug ===');
}

// Add debug function to window for manual testing
window.debugSuccessModalTabs = debugSuccessModalTabs;
window.testToggle = function() {
  console.log('🧪 MANUAL TOGGLE TEST');
  const btn = document.getElementById('toggleViewBtn');
  if (btn) {
    console.log('Button found:', btn);
    console.log('Button data-current:', btn.getAttribute('data-current'));
    console.log('Button innerHTML:', btn.innerHTML);
    toggleSuccessView();
  } else {
    console.error('❌ Toggle button not found!');
  }
};

function toggleSuccessView() {
  console.log('🔄 TOGGLE BUTTON CLICKED!');
  
  const tableTab = document.getElementById('table-tab');
  const jsonTab = document.getElementById('json-tab');
  const toggleBtn = document.getElementById('toggleViewBtn');
  
  if (!tableTab || !jsonTab || !toggleBtn) {
    console.error('❌ Missing elements for toggle:', { tableTab: !!tableTab, jsonTab: !!jsonTab, toggleBtn: !!toggleBtn });
    return;
  }
  
  const currentView = toggleBtn.getAttribute('data-current');
  console.log('Current view before toggle:', currentView);
  
  // Always clear both tabs first to prevent conflicts
  tableTab.classList.remove('active');
  jsonTab.classList.remove('active');
  tableTab.style.display = 'none';
  jsonTab.style.display = 'none';
  tableTab.style.visibility = 'hidden';
  jsonTab.style.visibility = 'hidden';
  
  if (currentView === 'table') {
    // Switch to JSON view
    jsonTab.classList.add('active');
    jsonTab.style.display = 'block';
    jsonTab.style.visibility = 'visible';
    
    // Update button
    toggleBtn.setAttribute('data-current', 'json');
    toggleBtn.innerHTML = '<i class="fas fa-table"></i> View as Table';
    
    console.log('Switched to JSON view');
  } else {
    // Switch to Table view
    tableTab.classList.add('active');
    tableTab.style.display = 'block';
    tableTab.style.visibility = 'visible';
    
    // Update button
    toggleBtn.setAttribute('data-current', 'table');
    toggleBtn.innerHTML = '<i class="fas fa-code"></i> View as JSON';
    
    console.log('Switched to Table view');
  }
  
  // Debug final state
  console.log('Final visibility:', {
    tableDisplay: getComputedStyle(tableTab).display,
    jsonDisplay: getComputedStyle(jsonTab).display,
    tableActive: tableTab.classList.contains('active'),
    jsonActive: jsonTab.classList.contains('active'),
    currentView: toggleBtn.getAttribute('data-current')
  });
}

async function displaySuccessModal(response) {
  if (!DOMElements.successModal) return;

  lastSubmissionResponse = response;
  DOMElements.fbrInvoiceNumber.textContent = response.fbrInvoiceNumber || "N/A";

  // JSON Response formatted
  const formattedResponse = JSON.stringify(response, null, 2);
  DOMElements.successResponseJson.textContent = formattedResponse;

  // Construct HTML for Table view
  let html = `<div style="margin-top: 20px;">
      <h3 style="color: #28a745; margin-bottom: 10px; font-size: 1rem;">✅ Submission Results</h3>
      <table class="response-table">
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Submission Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${response.invoiceNumber || response.fbrInvoiceNumber || 'Pending'}</strong></td>
            <td>${response.dated ? formatDateTime(response.dated) : formatDateTime(new Date())}</td>
            <td><span class="status-indicator status-success">Submitted</span></td>
          </tr>
        </tbody>
      </table>
    </div>`;

  // Item-level validation statuses if available
  if (response.validationResponse?.invoiceStatuses?.length > 0) {
    html += `<div style="margin-top: 15px;">
        <h4 style="color: #0052A5; font-size: 0.9rem;">📦 Item Processing Status</h4>
        <table class="response-table">
          <thead>
            <tr>
              <th>Item #</th>
              <th>Status Code</th>
              <th>Invoice Number</th>
              <th>Status</th>
              <th>Error Code</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>`;
    response.validationResponse.invoiceStatuses.forEach((item) => {
      html += `
            <tr>
              <td>${item.itemSNo}</td>
              <td>${item.statusCode || '-'}</td>
              <td>${item.invoiceNo || '-'}</td>
              <td>${item.status || '-'}</td>
              <td>${item.errorCode || '-'}</td>
              <td>${item.error || '-'}</td>
            </tr>`;
    });
    html += `
          </tbody>
        </table>
      </div>`;
  }

  // Inject table HTML
  DOMElements.successResponseData.innerHTML = html;

  // Show modal first
  DOMElements.successModal.classList.add("active");

  // Clean up any existing state first
  cleanupSuccessModal();

  // Set default view to table and ensure proper visibility
  const tableTab = document.getElementById('table-tab');
  const jsonTab = document.getElementById('json-tab');
  const toggleBtn = document.getElementById('toggleViewBtn');
  
  // First, clear all existing states to ensure clean initialization
  if (tableTab && jsonTab && toggleBtn) {
    // Clear all active states first
    tableTab.classList.remove('active');
    jsonTab.classList.remove('active');
    
    // Reset all display styles
    tableTab.style.display = '';
    jsonTab.style.display = '';
    tableTab.style.visibility = '';
    jsonTab.style.visibility = '';
    
    // Now set table as active (default view)
    tableTab.classList.add('active');
    tableTab.style.display = 'block';
    tableTab.style.visibility = 'visible';
    
    // Ensure JSON tab is hidden
    jsonTab.classList.remove('active');
    jsonTab.style.display = 'none';
    jsonTab.style.visibility = 'hidden';
    
    // Set button to initial state (showing table, button says "View as JSON")
    toggleBtn.setAttribute('data-current', 'table');
    toggleBtn.innerHTML = '<i class="fas fa-code"></i> View as JSON';
    
    console.log('SUCCESS MODAL: Tab visibility initialized - Table:', tableTab.classList.contains('active'), 'JSON:', jsonTab.classList.contains('active'));
  }

  // Attach toggle button event listener with multiple methods
  if (toggleBtn) {
    // Remove existing listeners by removing and re-adding the event
    toggleBtn.removeEventListener("click", toggleSuccessView);
    toggleBtn.addEventListener("click", toggleSuccessView);
    
    // Also add onclick as fallback
    toggleBtn.onclick = toggleSuccessView;
    
    // Ensure button is clickable
    toggleBtn.style.pointerEvents = 'auto';
    toggleBtn.style.cursor = 'pointer';
    
    // Also store the reference for debugging
    window.currentToggleBtn = toggleBtn;
    console.log('✅ Toggle button event listener attached:', toggleBtn.id);
    console.log('Button element:', toggleBtn);
    console.log('Button parent:', toggleBtn.parentElement);
  }
  
  // Debug the final state
  setTimeout(() => {
    debugSuccessModalTabs();
  }, 100);

  // Create "Preview" button and inject into modal footer
  const modalFooter = document.querySelector('#successModal .modal-footer');
  if (modalFooter) {
    const existingPreviewBtn = modalFooter.querySelector('.preview-invoice-btn');
    if (existingPreviewBtn) existingPreviewBtn.remove();

    const previewButton = document.createElement('button');
    previewButton.className = 'btn btn-primary preview-invoice-btn';
    previewButton.innerHTML = '<i class="fas fa-eye"></i> Preview As Invoice';
    previewButton.style.marginRight = '10px';
    previewButton.onclick = () => generateInvoicePDF(response, false, true);
    modalFooter.insertBefore(previewButton, modalFooter.firstChild);
  }
}


function handleFailedSubmission(response) {
  const errorMsg = (response && (response.message || response.error || response.statusMessage)) || "Unknown error from FBR.";
  showToast("error", "FBR Submission Failed", errorMsg);
  displayErrorModal(errorMsg);
}

function handleSubmissionError(error, errorDetails = null) {
  const errorMessage = error.message || error;
  showToast("error", "Submission Error", errorMessage);
  displayErrorModal(errorMessage, errorDetails);
}

function displayErrorModal(errorMsg, errorDetails = null) {
  if (DOMElements.errorModal) {
    // Set the main error message
    document.getElementById("errorModalMessage").textContent = errorMsg;
    
    // Handle error details if provided
    const errorDetailsElement = document.getElementById("errorDetails");
    const errorDetailsContent = document.getElementById("errorDetailsContent");
    const showDetailsBtn = document.getElementById("showErrorDetailsBtn");
    
    if (errorDetails && errorDetailsElement && errorDetailsContent) {
      // Format error details
      const detailsText = typeof errorDetails === 'object' 
        ? JSON.stringify(errorDetails, null, 2)
        : errorDetails.toString();
      
      errorDetailsContent.textContent = detailsText;
      
      // Show the details button
      if (showDetailsBtn) {
        showDetailsBtn.style.display = 'inline-block';
        
        // Add click handler for showing details
        showDetailsBtn.onclick = () => {
          const isVisible = errorDetailsElement.style.display !== 'none';
          errorDetailsElement.style.display = isVisible ? 'none' : 'block';
          showDetailsBtn.innerHTML = isVisible 
            ? '<i class="fas fa-info-circle"></i> Show Details'
            : '<i class="fas fa-eye-slash"></i> Hide Details';
        };
      }
    } else {
      // Hide details section if no details provided
      if (errorDetailsElement) errorDetailsElement.style.display = 'none';
      if (showDetailsBtn) showDetailsBtn.style.display = 'none';
    }
    
    // Show the modal
    DOMElements.errorModal.classList.add("active");
  }
}

async function validateRegistration(ntn) {
  try {
    const currentDate = new Date().toISOString().split("T")[0]
    const response = await fetchWithAuth(API_URLS.statl, {
      method: "POST",
      body: JSON.stringify({ regno: ntn, date: currentDate }),
    })

    if (response["status"] === "Active") {
      showToast("success", "Validation Success", "Registration is Active")
      return {
        status: "Active",
        statusCode: response["status code"],
      }
    }
  } catch (error) {
    console.error("Registration validation error:", error)
    showToast("error", "Validation Error", "Failed to validate registration status")
    return { status: "In-Active", statusCode: "01" }
  }
}

async function getRegistrationType(ntn) {
  try {
    const response = await fetchWithAuth(API_URLS.getRegType, {
      method: "POST",
      body: JSON.stringify({ Registration_No: ntn }),
    })
    
    if (response.REGISTRATION_TYPE === "Registered") {
      showToast("success", "Validation Success", "Registration is Registered")
      return {
        type: "Registered",
        statusCode: response.statuscode,
      }
    } else {
      showToast("warning", "Validation Error", "Registration is Unregistered")
      return {
        type: "unregistered",
        statusCode: response.statuscode,
      }
    }
  } catch (error) {
    console.error("Registration type error:", error)
    showToast("error", "Registration Error", "Failed to get registration type")
    return { type: "unregistered", statusCode: "01" }
  }
}
// Function to validate a registration number
// It will return an object with the status of the registration and the status code
// If the registration is active, it will return { status: "Active", statusCode: "00" }
// If the registration is in-active, it will return { status: "In-Active", statusCode: "01" }
// If the registration is not found, it will return { status: "Not Found", statusCode: "02" }


async function fetchWithAuth(endpoint, options = {}) {
try {
const sellers = await dbGetAll(STORE_NAMES.sellers)
const selectedSellerNTN = DOMElements.sellerSelect?.value || ""
const seller = sellers.find((s) => s.ntn === selectedSellerNTN)
if (!seller) {
  showToast("error", "Seller Error", "❌ No seller selected or seller not found");
  throw new Error("No seller selected");
}

const isProduction = DOMElements.modeToggle.checked;
const environment = isProduction ? "production" : "sandbox";
const token = isProduction ? seller.productionToken : seller.sandboxToken;

const url = typeof endpoint === "string" ? endpoint : endpoint[environment];

if (!url) {
  throw new Error(`No URL defined for endpoint in ${environment} mode`);
}

if (!token || token.trim() === "") {
  showToast("error", "Token Error", `❌ No ${environment} token available for seller`);
  throw new Error(`No ${environment} token available for seller`);
}

try {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: ensureBearerToken(token),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  } else {
    return await response.text();
  }
} catch (error) {
  console.error("Network error:", error);
  showToast("error", "Network Error", "Failed to connect to the server");
  throw error;
}
} catch (error) {
    console.error("Registration validation error:", error)
    showToast("error", "Validation Error", "Failed to validate registration status")
    return { status: "In-Active", statusCode: "01" }
  }
}


async function loadProvinces() {
  try {
    const response = await fetchWithAuth(API_URLS.provinces);
    if (Array.isArray(response) && response.length > 0) {
      provinces = response
      showToast("success", "Data Loaded", "Provinces loaded successfully")
    } else {
      provinces = defaultProvinces
    }
    populateProvinceSelects()
  } catch (error) {
    console.error("Failed to load provinces:", error)
    provinces = defaultProvinces
    populateProvinceSelects()
    showToast("error", "Load Error", "Failed to load provinces, using defaults")
  }
}

function populateProvinceSelects() {
  const selects = ["buyerProvince", "sellerProvince"]
  selects.forEach((selectId) => {
    const select = document.getElementById(selectId)
    if (select) {
      select.innerHTML = ''; // Clear existing content
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select Province";
      select.appendChild(defaultOption);
      // amazonq-ignore-next-line
      provinces.forEach((province) => {
        const option = document.createElement("option")
        option.value = province.stateProvinceDesc
        option.textContent = province.stateProvinceDesc
        select.appendChild(option)
      })
    }
  })
}

async function loadHSCodes() {
  try {
    const response = await fetchWithAuth(API_URLS.hsCodes)
    hsCodes = response || []
    
    // Sort HS codes by HS_CODE in ascending order
    hsCodes.sort((a, b) => a.hS_CODE.localeCompare(b.hS_CODE))
    showToast("success", "Data Loaded", `${hsCodes.length} HS Codes loaded successfully`)
    console.log("HS Codes loaded:", hsCodes.length)
    return hsCodes;
  } catch (error) {
    console.error("Failed to load HS Codes:", error)
    showToast("error", "Load Error", "Failed to load HS Codes")
    hsCodes = []
    return [];
  }
}

async function loadTransactionTypes() {
  try {
    transactionTypes = await fetchWithAuth(API_URLS.transactionTypes)
    showToast("success", "Data Loaded", `${transactionTypes.length} Transaction Types loaded`)
    console.log("Transaction Types loaded:", transactionTypes.length)
  } catch (error) {
    console.error("Failed to load Transaction Types:", error)
    showToast("error", "Load Error", "Failed to load Transaction Types")
  }
}

async function loadSROSchedules(rateId = 413) {
  try {
    const currentDate = formatDateForAPI(new Date(),"DD-MMM-YYYY")
    const url = `${API_URLS.SroSchedule}?rate_id=${rateId}&date=${currentDate}&origination_supplier_csv=1`
    sroSchedules = await fetchWithAuth(url)
    showToast("success", "Data Loaded", `${sroSchedules.length} SRO Schedules loaded`)
    console.log("SRO Schedules loaded:", sroSchedules.length)
  } catch (error) {
    console.error("Failed to load SRO Schedules:", error)
    showToast("error", "Load Error", "Failed to load SRO Schedules")
  }
}

async function loadSROItems(sroId, date) {
  try {
    const currentDate = formatDateForAPI(date, "YYYY-MM-DD");
    const url = `${API_URLS.SROItem}?date=${currentDate}&sro_id=${sroId}`
    const response = await fetchWithAuth(url)

    if (!Array.isArray(response)) {
      console.warn("Unexpected response format for SRO Items:", response)
      return []
    }
    
    sroItems[sroId] = response
    return response
  } catch (error) {
    console.error("Failed to load SRO Items:", error.message || error)
    showToast("error", "Load Error", `Failed to load SRO Items: ${error.message || error}`)
    return []
  }
}

async function fetchUoMOptions(hsCode, annexureId = 3) {
  try {
    const url = `${API_URLS.hsUom}?hs_code=${hsCode}&annexure_id=${annexureId}`
    const response = await fetchWithAuth(url)

    if (Array.isArray(response)) {
      return response.map((item) => item.description)
    } else {
      console.warn("Unexpected response format for UoM:", JSON.stringify(response))
      return []
    }
  } catch (error) {
    console.error("Failed to fetch UoM options:", error)
    return []
  }
}



async function fetchTaxRateOptions(serviceTypeId, buyerProvinceId, date) {
  try {
   
    console.log("serviceTypeId", serviceTypeId)
    console.log("buyerProvinceId ", buyerProvinceId)
    console.log("date", date)
    
    const province = provinces.find((p) => p.stateProvinceDesc === buyerProvinceId)
    const originationSupplier = province ? province.stateProvinceCode : 1

    const url = `${API_URLS.saleTypeToRate}?date=${formatDateForAPI(date, "DD-MMM-YYYY")}&transTypeId=${serviceTypeId}&originationSupplier=${originationSupplier}`
    const response = await fetchWithAuth(url)

    if (Array.isArray(response) && response.length > 0) {
      return response
    }
    return [{ ratE_DESC: "17%", ratE_VALUE: 17 }]
  } catch (error) {
    console.error("Failed to fetch tax rate options:", error)
    return [{ ratE_DESC: "17%", ratE_VALUE: 17 }]
  }
}

async function fetchSroSchedules(rateId, date, provinceCode) {
  try {
    
    const url = `${API_URLS.SroSchedule}?rate_id=${rateId}&date=${formatDateForAPI(date, "DD-MMM-YYYY")}&origination_supplier_csv=${provinceCode}`
    const response = await fetchWithAuth(url)


    if (Array.isArray(response)) {
      return response
    } else {
      console.warn("Unexpected response format for SRO Schedules:", response)
      throw new Error("Unexpected response format for SRO Schedules")
    }
  } catch (error) {
    console.error("Failed to fetch SRO Schedules:", error)
    showToast("error", "Load Error", "Failed to load SRO Schedules")
    throw error
  }
}

// Scenario management functions
function populateSectorOptions(businessActivity) {
  const sectorSelect = DOMElements.sellerSector
  if (!sectorSelect) return

  sectorSelect.innerHTML = '<option value="">Select Sector</option>'

  const sectors = [
    ...new Set(
      businessActivitySectorScenarios
        .filter((item) => item.businessActivity === businessActivity)
        .map((item) => item.sector),
    ),
  ]

  sectors.forEach((sector) => {
    const option = document.createElement("option")
    option.value = sector
    option.textContent = sector
    sectorSelect.appendChild(option)
  })
}

function populateScenarioOptions(businessActivity, sector) {

  const scenarioSelect = DOMElements.sellerScenarioSelect

  if (!scenarioSelect) return
  scenarioSelect.innerHTML = '<option value="">Select Scenario to Add</option>'
  const matchingConfig = findMatchingConfig(businessActivity, sector)
  if (matchingConfig) {
    const scenarioOptions = createScenarioOptions(matchingConfig.scenarios)
    appendScenarioOptions(scenarioSelect, scenarioOptions)
  }
}

function findMatchingConfig(businessActivity, sector) {
  return businessActivitySectorScenarios.find(
    (item) => item.businessActivity === businessActivity && item.sector === sector
  )
}

function createScenarioOptions(scenarios) {
  return scenarios.map((scenarioId) => {
    const scenarioDesc = scenarioDescriptions.find((s) => s.scenarioId === scenarioId)
    if (scenarioDesc) {
      return {
        value: scenarioId,
        text: `${scenarioId} - ${scenarioDesc.description}`
      }
    }
    return null
  }).filter(Boolean)
}

function appendScenarioOptions(selectElement, options) {
  options.forEach((option) => {
    const optionElement = document.createElement("option")
    optionElement.value = option.value
    optionElement.textContent = option.text
    selectElement.appendChild(optionElement)
  })
}

function addScenarioChip(scenarioId) {
  const chipsContainer = DOMElements.scenarioChips
  const hiddenInput = DOMElements.sellerScenarioIds

  if (!chipsContainer || !hiddenInput) return

  // Get current scenarios
  const currentScenarios = hiddenInput.value ? hiddenInput.value.split(",") : []

  // Check if already exists
  if (currentScenarios.includes(scenarioId)) {
    showToast("warning", "Duplicate Scenario", "This scenario is already added")
    return
  }

  // Add to array
  currentScenarios.push(scenarioId)
  hiddenInput.value = currentScenarios.join(",")

  // Create chip
  const scenarioDesc = scenarioDescriptions.find((s) => s.scenarioId === scenarioId)
  const chip = document.createElement("div")
  chip.className = "scenario-chip"
  chip.innerHTML = `
    ${scenarioId} - ${scenarioDesc ? scenarioDesc.description.substring(0, 30) + "..." : "Unknown"}
    <button type="button" class="remove-chip" onclick="removeScenarioChip('${scenarioId}')">&times;</button>
  `
  chipsContainer.appendChild(chip)
}

function removeScenarioChip(scenarioId) {
  const chipsContainer = DOMElements.scenarioChips
  const hiddenInput = DOMElements.sellerScenarioIds

  if (!chipsContainer || !hiddenInput) return

  // Remove from hidden input
  const currentScenarios = hiddenInput.value ? hiddenInput.value.split(",") : []
  const updatedScenarios = currentScenarios.filter((id) => id !== scenarioId)
  hiddenInput.value = updatedScenarios.join(",")

  // Remove chip from DOM
  const chips = chipsContainer.querySelectorAll(".scenario-chip")
  chips.forEach((chip) => {
    if (chip.innerHTML.includes(scenarioId)) {
      chip.remove()
    }
  })
}

async function populateInvoiceScenarios(sellerId, selectedScenarioId = null) {
  const scenarioSelect = DOMElements.scenarioId
  if (!scenarioSelect) return

  // Clear existing options first
  scenarioSelect.innerHTML = '<option value="">Select Scenario</option>'

  const sellers = await dbGetAll(STORE_NAMES.sellers) 
  const seller = sellers.find((s) => s.ntn === sellerId || s.id === sellerId)

  if (seller && seller.scenarioIds) {
    const sellerScenarios = Array.isArray(seller.scenarioIds) ? seller.scenarioIds : seller.scenarioIds.split(",")
    const addedScenarios = new Set(); // Track added scenarios to prevent duplicates

    sellerScenarios.forEach((scenarioId) => {
      const trimmedId = scenarioId.trim();
      if (!addedScenarios.has(trimmedId)) {
        const scenarioDesc = scenarioDescriptions.find((s) => s.scenarioId === trimmedId)
        if (scenarioDesc) {
          const option = document.createElement("option")
          option.value = trimmedId
          option.textContent = `${trimmedId} - ${scenarioDesc.description}`
          scenarioSelect.appendChild(option)
          addedScenarios.add(trimmedId);
        }
      }
    })
    
    // Set selected scenario if provided
    if (selectedScenarioId) {
      scenarioSelect.value = selectedScenarioId
    } else if (scenarioSelect.options.length > 1) {
      scenarioSelect.selectedIndex = 1;
    }
  }
}



// Product Modal Functions
function initProductModal() {
  const productModal = document.getElementById('productModal');
  const addProductBtn = document.getElementById('addProductBtn');
  const closeProductModal = document.getElementById('closeProductModal');
  const cancelProductBtn = document.getElementById('cancelProductBtn');
  const saveProductBtn = document.getElementById('saveProductBtn');
  const addToInvoiceBtn = document.getElementById('addToInvoiceBtn');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');

  if (!productModal || !addProductBtn || !saveProductBtn) {
    console.warn('Product modal elements not found');
    return;
  }

  addProductBtn.addEventListener('click', async () => {
    currentEditingProduct = null;
    productForm.reset();
    productModalTitle.textContent = 'Add New Product';
    addToInvoiceBtn.style.display = 'none';
    showProductModalLoader(true);
    productModal.classList.add('active');
    await populateProductModalOptions();
    showProductModalLoader(false);
  });

  closeProductModal?.addEventListener('click', () => {
    productModal.classList.remove('active');
  });

  cancelProductBtn?.addEventListener('click', () => {
    productModal.classList.remove('active');
  });

  // HS Code search handler
  let productHsSearchTimeout;
  document.getElementById('productHsCode').addEventListener('input', (e) => {
    clearTimeout(productHsSearchTimeout);
    productHsSearchTimeout = setTimeout(() => {
      searchProductHSCodes(e.target.value);
    }, 250);
  });

  // Province change handler
  document.getElementById('productOriginProvince').addEventListener('change', async () => {
    await loadProductTaxRates();
  });

  // Service type change handler
  document.getElementById('productType').addEventListener('change', async (e) => {
    const serviceType = e.target.value;
    toggleStockFields(serviceType);
    await loadProductTaxRates();
  });

  // Tax rate change handler
  document.getElementById('productTaxRate').addEventListener('change', async (e) => {
    const selectedOption = e.target.selectedOptions[0];
    if (selectedOption && selectedOption.dataset.rateId) {
      await loadProductSroSchedules(selectedOption.dataset.rateId);
    }
  });

  // SRO Schedule change handler
  document.getElementById('productSroSchedule').addEventListener('change', async (e) => {
    const sroId = e.target.value;
    if (sroId) {
      await loadProductSroItems(sroId);
    }
  });

  addToInvoiceBtn.addEventListener('click', async () => {
    try {
      const selectedOption = document.getElementById('productType').selectedOptions[0];
      const serviceTypeId = selectedOption ? selectedOption.dataset.id : null;
      
      const product = {
        hsCode: document.getElementById('productHsCode').value,
        productName: document.getElementById('productName').value,
        productType: document.getElementById('productType').value,
        serviceTypeId: serviceTypeId,
        uom: document.getElementById('productUom').value,
        saleRate: parseFloat(document.getElementById('productSaleRate').value) || 0,
        taxRate: parseFloat(document.getElementById('productTaxRate').value) || 0,
        originProvince: document.getElementById('productOriginProvince').value
      };

      await addProductToInvoice(product);
      productModal.classList.remove('active');
      switchToCreateInvoiceTab();
      showToast('success', 'Product Added', 'Product has been added to the invoice');
    } catch (error) {
      console.error('Error adding product to invoice:', error);
      showToast('error', 'Add Failed', 'Failed to add product to invoice: ' + error.message);
    }
  });

  saveProductBtn.addEventListener('click', async () => {
    try {
      await openDB();
      
      const product = {
        id: currentEditingProduct ? currentEditingProduct.id : Date.now().toString(),
        hsCode: document.getElementById('productHsCode').value,
        productName: document.getElementById('productName').value,
        productType: document.getElementById('productType').value,
        uom: document.getElementById('productUom').value,
        purchaseRate: parseFloat(document.getElementById('productPurchaseRate').value) || 0,
        saleRate: parseFloat(document.getElementById('productSaleRate').value) || 0,
        taxRate: parseFloat(document.getElementById('productTaxRate').value) || 0,
        status: document.getElementById('productStatus').value,
        description: document.getElementById('productDescription').value,
        originProvince: document.getElementById('productOriginProvince').value,
        sroSchedule: document.getElementById('productSroSchedule').value,
        sroItem: document.getElementById('productSroItem').value,
        openingStock: parseFloat(document.getElementById('productOpeningStock').value) || 0,
        lowStock: parseFloat(document.getElementById('productLowStock').value) || 0,
        createdAt: currentEditingProduct ? currentEditingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dbSet(STORE_NAMES.products, product);
      productForm.reset();
      productModal.classList.remove('active');
      const wasEditing = currentEditingProduct !== null;
      currentEditingProduct = null;
      showToast('success', wasEditing ? 'Product Updated' : 'Product Added', 
                wasEditing ? 'Product has been updated successfully' : 'Product has been added successfully');
      await populateProductsTable();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('error', 'Save Failed', 'Failed to save product: ' + error.message);
    }
  });
}

// Show/hide product modal loader
function showProductModalLoader(show) {
  const loader = document.getElementById('productModalLoader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
    loader.style.pointerEvents = show ? 'all' : 'none';
  }
}

// Populate product modal options
async function populateProductModalOptions() {
  // Set current date
  document.getElementById('productDate').value = getCurrentDate('YYYY-MM-DD');
  
  // Populate provinces from already fetched data
  if (provinces && provinces.length > 0) {
    const provinceOptions = provinces.map(p => ({ value: p.stateProvinceDesc, text: p.stateProvinceDesc }));
    populateSelect('productOriginProvince', provinceOptions);
  }

  // Populate service types from already fetched transaction types
  if (transactionTypes && transactionTypes.length > 0) {
    const typeOptions = transactionTypes.map(t => ({ value: t.transactioN_DESC, text: t.transactioN_DESC, id: t.transactioN_TYPE_ID }));
    populateSelectWithData('productType', typeOptions);
  }
}

// Search HS codes for product modal
function searchProductHSCodes(searchTerm) {
  const suggestionsDiv = document.getElementById('productHsCodeSuggestions');
  
  if (!searchTerm || searchTerm.length < 2) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  const filteredCodes = hsCodes
    .filter(hs => 
      hs.hS_CODE.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hs.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  if (filteredCodes.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  suggestionsDiv.innerHTML = filteredCodes
    .map(hs => `
      <div onclick="selectProductHSCode('${hs.hS_CODE}', '${hs.description.replace(/'/g, "\\'")}')"
           style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">
        <strong>${hs.hS_CODE}</strong><br>
        <small>${hs.description}</small>
      </div>
    `)
    .join('');

  suggestionsDiv.style.display = 'block';
}

// Select HS code for product
window.selectProductHSCode = async (hsCode, description) => {
  document.getElementById('productHsCode').value = hsCode;
  const cleanedName = description.replace(/^--+|--+$/g, '').trim();
  document.getElementById('productName').value = cleanedName;
  document.getElementById('productDescription').value = description;
  document.getElementById('productHsCodeSuggestions').style.display = 'none';
  
  // Load UoM options
  showProductModalLoader(true);
  const uomOptions = await fetchUoMOptions(hsCode, 3);
  populateSelect('productUom', uomOptions.map(uom => ({ value: uom, text: uom })));
  showProductModalLoader(false);
};

// Helper function to populate select elements
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  const currentValue = select.value;
  const firstOption = select.querySelector('option');
  select.innerHTML = '';
  
  if (firstOption) {
    select.appendChild(firstOption);
  }
  
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    select.appendChild(optionElement);
  });
  
  if (currentValue) {
    select.value = currentValue;
  }
}

// Load tax rates for product
async function loadProductTaxRates() {
  try {
    const serviceTypeText = document.getElementById('productType').value;
    const originProvince = document.getElementById('productOriginProvince').value;
    
    if (!serviceTypeText || !originProvince) return;
    
    // Get service type ID from the selected option
    const selectedOption = document.getElementById('productType').selectedOptions[0];
    const serviceTypeId = selectedOption ? selectedOption.dataset.id : null;
    
    if (!serviceTypeId) return;
    
    showProductModalLoader(true);
    const date = document.getElementById('productDate').value;
    const formattedDate = formatDateForAPI(date, 'DD-MMM-YYYY');
    
    const taxRateOptions = await fetchTaxRateOptions(serviceTypeId, originProvince, formattedDate);
    
    if (taxRateOptions && taxRateOptions.length > 0) {
      const rateOptions = taxRateOptions.map(rate => ({ 
        value: rate.ratE_VALUE, 
        text: `${rate.ratE_DESC} (${rate.ratE_VALUE}%)`,
        rateId: rate.ratE_ID
      }));
      populateSelectWithData('productTaxRate', rateOptions);
      // Auto-select first option if none selected
      const taxRateSelect = document.getElementById('productTaxRate');
      if (!taxRateSelect.value && rateOptions.length > 0) {
        taxRateSelect.value = rateOptions[0].value;
      }
    }
    showProductModalLoader(false);
  } catch (error) {
    console.error('Error loading tax rates:', error);
    showProductModalLoader(false);
  }
}

// Load SRO schedules for product
async function loadProductSroSchedules(rateId) {
  try {
    showProductModalLoader(true);
    const date = document.getElementById('productDate').value;
    const formattedDate = formatDateForAPI(date, 'DD-MMM-YYYY');
    const originProvince = document.getElementById('productOriginProvince').value;
    
    const province = provinces.find(p => p.stateProvinceDesc === originProvince);
    const provinceCode = province ? province.stateProvinceCode : 1;
    
    const sroScheduleOptions = await fetchSroSchedules(rateId, formattedDate, provinceCode);
    
    if (sroScheduleOptions && sroScheduleOptions.length > 0) {
      const scheduleOptions = sroScheduleOptions.map(sro => ({ 
        value: sro.srO_ID, 
        text: sro.srO_DESC 
      }));
      populateSelect('productSroSchedule', scheduleOptions);
      // Auto-select first option (0-indexed)
      if (scheduleOptions.length > 0) {
        document.getElementById('productSroSchedule').value = scheduleOptions[0].value;
      }
    }
    showProductModalLoader(false);
  } catch (error) {
    console.error('Error loading SRO schedules:', error);
    showProductModalLoader(false);
  }
}

// Load SRO items for product
async function loadProductSroItems(sroId) {
  try {
    showProductModalLoader(true);
    const date = document.getElementById('productDate').value;
    
    const sroItemOptions = await loadSROItems(sroId, date);
    
    if (sroItemOptions && sroItemOptions.length > 0) {
      const itemOptions = sroItemOptions.map(item => ({ 
        value: item.srO_ITEM_ID, 
        text: item.srO_ITEM_DESC 
      }));
      populateSelect('productSroItem', itemOptions);
      // Auto-select first option (0-indexed)
      if (itemOptions.length > 0) {
        document.getElementById('productSroItem').value = itemOptions[0].value;
      }
    }
    showProductModalLoader(false);
  } catch (error) {
    console.error('Error loading SRO items:', error);
    showProductModalLoader(false);
  }
}

// Toggle stock fields based on product type
function toggleStockFields(serviceType) {
  const stockFields = document.getElementById('stockFields');
  if (stockFields) {
    const isGoods = serviceType && !serviceType.toLowerCase().includes('service');
    stockFields.style.display = isGoods ? 'flex' : 'none';
  }
}

// Populate select with data attributes
function populateSelectWithData(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  const currentValue = select.value;
  const firstOption = select.querySelector('option');
  select.innerHTML = '';
  
  if (firstOption) {
    select.appendChild(firstOption);
  }
  
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    if (option.rateId) {
      optionElement.dataset.rateId = option.rateId;
    }
    if (option.id) {
      optionElement.dataset.id = option.id;
    }
    select.appendChild(optionElement);
  });
  
  if (currentValue) {
    select.value = currentValue;
  }
}

// Add product to invoice with full API chaining
async function addProductToInvoice(product) {
  const itemId = `item-${itemCounter++}`;
  const buyer = await getSelectedBuyer();
  
  if (!buyer) {
    throw new Error('Please select a buyer first');
  }
  
  if (!product.serviceTypeId) {
    throw new Error('Invalid service type');
  }
  
  const item = {
    id: itemId,
    hsCode: product.hsCode,
    description: product.productName,
    serviceTypeId: product.serviceTypeId,
    saleType: product.productType,
    uom: product.uom,
    quantity: 1,
    unitPrice: product.saleRate,
    taxRate: product.taxRate,
    extraTax: 0,
    furtherTax: 0,
    discount: 0,
    fedPayable: 0,
    salesTaxWithheldAtSource: 0,
    rateId: null,
    sroSchedule: '',
    sroItem: '',
    uomOptions: [product.uom],
    taxRateOptions: [],
    sroScheduleOptions: [],
    sroItemOptions: [],
    annexureId: 3
  };
  
  const date = DOMElements.invoiceDate.value || new Date().toISOString().split('T')[0];
  const formattedDate = formatDateForAPI(date, 'DD-MMM-YYYY');
  
  item.taxRateOptions = await fetchTaxRateOptions(item.serviceTypeId, buyer.province, formattedDate);
  
  if (item.taxRateOptions.length > 0) {
    const selectedTaxRate = item.taxRateOptions.find(rate => rate.ratE_VALUE == product.taxRate) || item.taxRateOptions[0];
    item.taxRate = selectedTaxRate.ratE_VALUE;
    item.rateId = selectedTaxRate.ratE_ID;
    
    const province = provinces.find(p => p.stateProvinceDesc === buyer.province);
    const provinceCode = province ? province.stateProvinceCode : 1;
    
    item.sroScheduleOptions = await fetchSroSchedules(item.rateId, formattedDate, provinceCode);
    
    if (item.sroScheduleOptions.length > 0) {
      item.sroSchedule = item.sroScheduleOptions[0].srO_ID;
      item.sroItemOptions = await loadSROItems(item.sroSchedule, date);
      
      if (item.sroItemOptions.length > 0) {
        item.sroItem = item.sroItemOptions[0].srO_ITEM_ID;
      }
    }
  }
  
  items.push(item);
  renderItems();
  updateInvoiceTotal();
}

window.openAddProductModal = async () => {
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');
  const addToInvoiceBtn = document.getElementById('addToInvoiceBtn');
  
  if (productModal && productForm && productModalTitle) {
    currentEditingProduct = null;
    productForm.reset();
    productModalTitle.textContent = 'Add New Product';
    addToInvoiceBtn.style.display = 'inline-block';
    showProductModalLoader(true);
    productModal.classList.add('active');
    await populateProductModalOptions();
    showProductModalLoader(false);
  }
};

window.addProductToInvoiceFromTable = async (productId) => {
  const product = await dbGet(STORE_NAMES.products, productId);
  if (!product) return;
  
  try {
    // Get service type ID from transaction types
    const serviceType = transactionTypes.find(t => t.transactioN_DESC === product.productType);
    const serviceTypeId = serviceType ? serviceType.transactioN_TYPE_ID : null;
    
    if (!serviceTypeId) {
      showToast('error', 'Add Failed', 'Invalid service type for this product');
      return;
    }
    
    await addProductToInvoice({
      hsCode: product.hsCode,
      productName: product.productName,
      productType: product.productType,
      serviceTypeId: serviceTypeId,
      uom: product.uom,
      saleRate: product.saleRate,
      taxRate: product.taxRate,
      originProvince: product.originProvince
    });
    switchToCreateInvoiceTab();
    // showToast('success', 'Product Added', 'Product has been added to the invoice');
  } catch (error) {
    showToast('error', 'Add Failed', 'Failed to add product to invoice: ' + error.message);
  }
};

// Search products
function searchProducts(products, searchTerm) {
  if (!searchTerm) return products;
  
  searchTerm = searchTerm.toLowerCase();
  return products.filter(product => {
    return (
      (product.hsCode || '').toLowerCase().includes(searchTerm) ||
      (product.productName || '').toLowerCase().includes(searchTerm) ||
      (product.productType || '').toLowerCase().includes(searchTerm) ||
      (product.uom || '').toLowerCase().includes(searchTerm) ||
      (product.description || '').toLowerCase().includes(searchTerm)
    );
  });
}

// Filter products
function filterProducts(products, typeFilter, statusFilter) {
  return products.filter(product => {
    const typeMatch = typeFilter === 'all' || product.productType === typeFilter;
    const statusMatch = statusFilter === 'all' || product.status === statusFilter;
    
    return typeMatch && statusMatch;
  });
}

// Pagination state
let currentProductsPage = 1;
let currentSellersPage = 1;
let currentBuyersPage = 1;
let currentInvoicesPage = 1;


// Generic pagination function
function paginate(data, page, perPage) {
  if (perPage === 'all') return { data, totalPages: 1, currentPage: 1 };
  
  const itemsPerPage = parseInt(perPage);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    data: data.slice(startIndex, endIndex),
    totalPages,
    currentPage: page,
    totalItems: data.length,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, data.length)
  };
}

// Generic pagination controls
function createPaginationControls(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  // Always show pagination controls for testing purposes, even with 1 page
  // Commented out the early return to enable testing with 1 item per page
  // if (totalPages <= 1) return;
  
  // Show at least basic pagination info even with 1 page
  if (totalPages < 1) return;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = `btn btn-sm ${currentPage === 1 ? 'btn-secondary' : 'btn-primary'}`;
  prevBtn.style.marginRight = '5px';
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prevBtn);
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
    pageBtn.style.marginRight = '5px';
    pageBtn.textContent = i;
    pageBtn.onclick = () => onPageChange(i);
    container.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = `btn btn-sm ${currentPage === totalPages ? 'btn-secondary' : 'btn-primary'}`;
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(nextBtn);
}

// Function to attach per page event listeners
function attachPerPageListeners() {
  // Attach invoices per page listener
  const invoicesPerPage = document.getElementById('invoicesPerPage');
  if (invoicesPerPage) {
    invoicesPerPage.removeEventListener('change', onInvoicesPerPageChange);
    invoicesPerPage.addEventListener('change', onInvoicesPerPageChange);
  }
  
  // Attach products per page listener
  const productsPerPage = document.getElementById('productsPerPage');
  if (productsPerPage) {
    productsPerPage.removeEventListener('change', onProductsPerPageChange);
    productsPerPage.addEventListener('change', onProductsPerPageChange);
  }
  
  // Attach sellers per page listener
  const sellersPerPage = document.getElementById('sellersPerPage');
  if (sellersPerPage) {
    sellersPerPage.removeEventListener('change', onSellersPerPageChange);
    sellersPerPage.addEventListener('change', onSellersPerPageChange);
  }
  
  // Attach buyers per page listener
  const buyersPerPage = document.getElementById('buyersPerPage');
  if (buyersPerPage) {
    buyersPerPage.removeEventListener('change', onBuyersPerPageChange);
    buyersPerPage.addEventListener('change', onBuyersPerPageChange);
  }
}

// Per page change handlers
function onInvoicesPerPageChange() {
  currentInvoicesPage = 1;
  populateInvoicesTable();
}

function onProductsPerPageChange() {
  currentProductsPage = 1;
  populateProductsTable();
}

function onSellersPerPageChange() {
  currentSellersPage = 1;
  populateSellersTable();
}

function onBuyersPerPageChange() {
  currentBuyersPage = 1;
  populateBuyersTable();
}


// Initialize product filters
function initProductFilters() {
  const searchInput = document.getElementById('productSearch');
  const typeFilter = document.getElementById('productTypeFilter');
  const statusFilter = document.getElementById('productStatusFilter');

  // Handle search input
  searchInput?.addEventListener('input', debounce(() => {
    currentProductsPage = 1;
    populateProductsTable();
  }, 300));

  // Handle filters
  [typeFilter, statusFilter].forEach(filter => {
    filter?.addEventListener('change', () => {
      currentProductsPage = 1;
      populateProductsTable();
    });
  });
}

let currentEditingProduct = null;

window.editProduct = async (productId) => {
  const product = await dbGet(STORE_NAMES.products, productId);
  if (!product) return;
  
  currentEditingProduct = product;
  
  showProductModalLoader(true);
  document.getElementById('productModal').classList.add('active');
  
  await populateProductModalOptions();
  
  // Populate basic fields
  document.getElementById('productHsCode').value = product.hsCode || '';
  document.getElementById('productName').value = product.productName || '';
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productType').value = product.productType || '';
  toggleStockFields(product.productType);
  document.getElementById('productUom').value = product.uom || '';
  document.getElementById('productPurchaseRate').value = product.purchaseRate || 0;
  document.getElementById('productSaleRate').value = product.saleRate || 0;
  document.getElementById('productStatus').value = product.status || 'Active';
  document.getElementById('productOriginProvince').value = product.originProvince || '';
  document.getElementById('productOpeningStock').value = product.openingStock || 0;
  document.getElementById('productLowStock').value = product.lowStock || 0;
  
  // Load and populate tax rates, SRO schedule and items
  if (product.productType && product.originProvince) {
    await loadProductTaxRates();
    document.getElementById('productTaxRate').value = product.taxRate || 0;
    
    // Load SRO schedules if tax rate exists
    const taxRateSelect = document.getElementById('productTaxRate');
    const selectedTaxOption = taxRateSelect.selectedOptions[0];
    if (selectedTaxOption && selectedTaxOption.dataset.rateId) {
      await loadProductSroSchedules(selectedTaxOption.dataset.rateId);
      document.getElementById('productSroSchedule').value = product.sroSchedule || '';
      
      // Load SRO items if schedule exists
      if (product.sroSchedule) {
        await loadProductSroItems(product.sroSchedule);
        document.getElementById('productSroItem').value = product.sroItem || '';
      }
    }
  }
  
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('addToInvoiceBtn').style.display = 'inline-block';
  showProductModalLoader(false);
};

window.deleteProduct = async (productId) => {
  if (confirm('Are you sure you want to delete this product?')) {
    await dbDelete(STORE_NAMES.products, productId);
    await populateProductsTable();
    showToast('success', 'Product Deleted', 'Product has been removed successfully');
  }
};

// Tab navigation
function initTabNavigation() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
      document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
      
      this.classList.add("active")
      const tabId = this.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")
    })
  })
}

// Function to switch to Create Invoice tab
window.switchToCreateInvoiceTab = () => {
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
  
  document.querySelector('[data-tab="invoice-tab"]').classList.add("active")
  document.getElementById("invoice-tab").classList.add("active")
}


// Populate dropdowns
async function populateSellerSelect() {
  const sellers = await dbGetAll(STORE_NAMES.sellers);
  const select = DOMElements.sellerSelect;
  select.innerHTML = '<option value="">Select Seller</option>';

  sellers.forEach((seller) => {
    const option = document.createElement("option");
    option.value = seller.ntn;
    option.textContent = `${seller.businessName} (${seller.ntn})`;
    select.appendChild(option);
  });

  if (sellers.length > 0) {
    select.value = sellers[0].ntn;
    await populateInvoiceScenarios(sellers[0].ntn);
    await updateInvoiceReference();
  }

  // Add event listener for seller change
  select.addEventListener("change", async function () {
    const currentScenarioId = DOMElements.scenarioId.value;
    await populateInvoiceScenarios(this.value);
    await updateInvoiceReference();
  });
}

async function populateBuyerSelect() {
  const buyers = await dbGetAll(STORE_NAMES.buyers);
  const select = DOMElements.buyerSelect;
  select.innerHTML = '<option value="">Select Buyer</option>';

  buyers.forEach((buyer) => {
    const option = document.createElement("option");
    option.value = buyer.ntn;
    option.textContent = `${buyer.businessName} (${buyer.ntn})`;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const selectedBuyer = buyers.find((b) => b.ntn === this.value);
    const buyerRegStatusField = document.getElementById("buyerRegStatus");
    if (selectedBuyer && buyerRegStatusField) {
      buyerRegStatusField.value = selectedBuyer.registrationStatus || "Unknown";
    } else if (buyerRegStatusField) {
      buyerRegStatusField.value = "";
    }
  });

  if (buyers.length > 0) {
    select.value = buyers[0].ntn;
    select.dispatchEvent(new Event("change"));
  }
}

async function updateInvoiceReference() {
  await resetInvoiceReference()
}



let sellerSortField = null;
let sellerSortDirection = 'asc';

// Search sellers
function searchSellers(sellers, searchTerm) {
  if (!searchTerm) return sellers;
  
  searchTerm = searchTerm.toLowerCase();
  return sellers.filter(seller => {
    return (
      (seller.ntn || '').toLowerCase().includes(searchTerm) ||
      (seller.businessName || '').toLowerCase().includes(searchTerm) ||
      (seller.province || '').toLowerCase().includes(searchTerm) ||
      (seller.registrationStatus || '').toLowerCase().includes(searchTerm) ||
      (seller.registrationType || '').toLowerCase().includes(searchTerm)
    );
  });
}

// Filter sellers
function filterSellers(sellers, provinceFilter, statusFilter, regStatusFilter) {
  return sellers.filter(seller => {
    const provinceMatch = provinceFilter === 'all' || seller.province === provinceFilter;
    const statusMatch = statusFilter === 'all' || seller.registrationStatus === statusFilter;
    const regStatusMatch = regStatusFilter === 'all' || seller.registrationType === regStatusFilter;
    
    return provinceMatch && statusMatch && regStatusMatch;
  });
}

// Sort sellers
function sortSellers(field) {
  if (sellerSortField === field) {
    sellerSortDirection = sellerSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sellerSortField = field;
    sellerSortDirection = 'asc';
  }
  
  // Update sort icons
  document.querySelectorAll('[id^="sort-"]').forEach(icon => {
    icon.className = 'fas fa-sort';
  });
  
  const sortIcon = document.getElementById(`sort-${field}`);
  if (sortIcon) {
    sortIcon.className = `fas fa-sort-${sellerSortDirection === 'asc' ? 'up' : 'down'}`;
  }
  
  populateSellersTable();
}

window.sortSellers = sortSellers;

async function populateSellersTable() {
  let sellers = await dbGetAll(STORE_NAMES.sellers);
  const tbody = DOMElements.sellersTableBody;
  
  // Get filter values
  const searchTerm = document.getElementById('sellerSearch')?.value || '';
  const provinceFilter = document.getElementById('sellerProvinceFilter')?.value || 'all';
  const statusFilter = document.getElementById('sellerStatusFilter')?.value || 'all';
  const regStatusFilter = document.getElementById('sellerRegStatusFilter')?.value || 'all';
  const perPage = document.getElementById('sellersPerPage')?.value || '20';
  
  // Apply filters
  const filteredSellers = filterSellers(searchSellers(sellers, searchTerm), provinceFilter, statusFilter, regStatusFilter);
  
  // Apply sorting
  if (sellerSortField) {
    filteredSellers.sort((a, b) => {
      const aVal = (a[sellerSortField] || '').toString().toLowerCase();
      const bVal = (b[sellerSortField] || '').toString().toLowerCase();
      
      if (sellerSortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
  }
  
  // Apply pagination
  const paginatedData = paginate(filteredSellers, currentSellersPage, perPage);
  
  tbody.innerHTML = "";

  if (filteredSellers.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center;">
        No Seller Data found in Record
        <button class="btn btn-primary" onclick="openAddSellerModal()">Add Seller</button>
      </td>
    `;
    tbody.appendChild(row);
    document.getElementById('sellersPaginationInfo').innerHTML = 'Showing <select id="sellersPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20" selected>20</option><option value="50">50</option><option value="100">100</option><option value="all">All</option></select> of 0 items';
    attachPerPageListeners();
    return;
  }

  paginatedData.data.forEach((seller) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${seller.ntn}</td>
      <td>${seller.businessName}</td>
      <td>${seller.province}</td>
      <td>${seller.registrationStatus || "Unknown"}</td>
      <td>${seller.registrationType || "Unknown"}</td>
      <td class="action-cell">
        <button class="btn btn-edit" onclick="editSeller('${seller.ntn}')" title="Edit Seller">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-delete" onclick="confirmDeleteSeller('${seller.ntn}')" title="Delete Seller">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Update pagination info and controls
  const paginationInfo = document.getElementById('sellersPaginationInfo');
  if (paginationInfo) {
    const perPageText = perPage === 'all' ? 'All' : perPage;
    if (perPage === 'all') {
      paginationInfo.innerHTML = `Showing <select id="sellersPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all" selected>All</option></select> of ${filteredSellers.length} items`;
    } else {
      paginationInfo.innerHTML = `Showing <select id="sellersPerPage" class="per-page-select"><option value="1"${perPage==='1'?' selected':''}>1</option><option value="10"${perPage==='10'?' selected':''}>10</option><option value="20"${perPage==='20'?' selected':''}>20</option><option value="50"${perPage==='50'?' selected':''}>50</option><option value="100"${perPage==='100'?' selected':''}>100</option><option value="all">All</option></select> of ${paginatedData.totalItems} items`;
    }
    // Attach event listener after updating HTML
    attachPerPageListeners();
  }
  
  createPaginationControls('sellersPaginationControls', paginatedData.currentPage, paginatedData.totalPages, (page) => {
    currentSellersPage = page;
    populateSellersTable();
  });
  
  // Populate province filter options
  populateSellerProvinceFilter(await dbGetAll(STORE_NAMES.sellers));
}

// Populate province filter dropdown
function populateSellerProvinceFilter(sellers) {
  const provinceFilter = document.getElementById('sellerProvinceFilter');
  if (!provinceFilter) return;
  
  const provinces = [...new Set(sellers.map(s => s.province).filter(Boolean))];
  
  // Keep the current selection
  const currentValue = provinceFilter.value;
  
  provinceFilter.innerHTML = '<option value="all">All Provinces</option>';
  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceFilter.appendChild(option);
  });
  
  // Restore selection
  provinceFilter.value = currentValue;
}

// Initialize seller filters
function initSellerFilters() {
  const searchInput = document.getElementById('sellerSearch');
  const provinceFilter = document.getElementById('sellerProvinceFilter');
  const statusFilter = document.getElementById('sellerStatusFilter');
  const regStatusFilter = document.getElementById('sellerRegStatusFilter');

  // Handle search input
  searchInput?.addEventListener('input', debounce(() => {
    currentSellersPage = 1;
    populateSellersTable();
  }, 300));

  // Handle filters
  [provinceFilter, statusFilter, regStatusFilter].forEach(filter => {
    filter?.addEventListener('change', () => {
      currentSellersPage = 1;
      populateSellersTable();
    });
  });
}

let buyerSortField = null;
let buyerSortDirection = 'asc';

// Search buyers
function searchBuyers(buyers, searchTerm) {
  if (!searchTerm) return buyers;
  
  searchTerm = searchTerm.toLowerCase();
  return buyers.filter(buyer => {
    return (
      (buyer.businessName || '').toLowerCase().includes(searchTerm) ||
      (buyer.ntn || '').toLowerCase().includes(searchTerm) ||
      (buyer.registrationType || '').toLowerCase().includes(searchTerm) ||
      (buyer.province || '').toLowerCase().includes(searchTerm) ||
      (buyer.registrationStatus || '').toLowerCase().includes(searchTerm)
    );
  });
}

// Filter buyers
function filterBuyers(buyers, provinceFilter, regTypeFilter, statusFilter) {
  return buyers.filter(buyer => {
    const provinceMatch = provinceFilter === 'all' || buyer.province === provinceFilter;
    const regTypeMatch = regTypeFilter === 'all' || buyer.registrationType === regTypeFilter;
    const statusMatch = statusFilter === 'all' || buyer.registrationStatus === statusFilter;
    
    return provinceMatch && regTypeMatch && statusMatch;
  });
}

// Sort buyers
function sortBuyers(field) {
  if (buyerSortField === field) {
    buyerSortDirection = buyerSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    buyerSortField = field;
    buyerSortDirection = 'asc';
  }
  
  // Update sort icons
  document.querySelectorAll('[id^="sort-buyer-"]').forEach(icon => {
    icon.className = 'fas fa-sort';
  });
  
  const sortIcon = document.getElementById(`sort-buyer-${field}`);
  if (sortIcon) {
    sortIcon.className = `fas fa-sort-${buyerSortDirection === 'asc' ? 'up' : 'down'}`;
  }
  
  populateBuyersTable();
}

window.sortBuyers = sortBuyers;

async function populateBuyersTable() {
  let buyers = await dbGetAll(STORE_NAMES.buyers);
  const tbody = DOMElements.buyersTableBody;
  
  // Get filter values
  const searchTerm = document.getElementById('buyerSearch')?.value || '';
  const provinceFilter = document.getElementById('buyerProvinceFilter')?.value || 'all';
  const regTypeFilter = document.getElementById('buyerRegTypeFilter')?.value || 'all';
  const statusFilter = document.getElementById('buyerStatusFilter')?.value || 'all';
  const perPage = document.getElementById('buyersPerPage')?.value || '20';
  
  // Apply filters
  const filteredBuyers = filterBuyers(searchBuyers(buyers, searchTerm), provinceFilter, regTypeFilter, statusFilter);
  
  // Apply sorting
  if (buyerSortField) {
    filteredBuyers.sort((a, b) => {
      const aVal = (a[buyerSortField] || '').toString().toLowerCase();
      const bVal = (b[buyerSortField] || '').toString().toLowerCase();
      
      if (buyerSortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
  }
  
  // Apply pagination
  const paginatedData = paginate(filteredBuyers, currentBuyersPage, perPage);
  
  tbody.innerHTML = "";

  if (filteredBuyers.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center;">
        No Buyer Data found in Record
        <button class="btn btn-primary" onclick="openAddBuyerModal()">Add Buyer</button>
      </td>
    `;
    tbody.appendChild(row);
    document.getElementById('buyersPaginationInfo').innerHTML = 'Showing <select id="buyersPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20" selected>20</option><option value="50">50</option><option value="100">100</option><option value="all">All</option></select> of 0 items';
    attachPerPageListeners();
    return;
  }

  paginatedData.data.forEach((buyer) => {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${buyer.ntn}</td>
      <td>${buyer.businessName}</td>
      <td>${buyer.province}</td>
      <td>${buyer.registrationType}</td>
      <td>${buyer.registrationStatus || "Unknown"}</td>
      <td class="action-cell">
        <button class="btn btn-edit" onclick="editBuyer('${buyer.ntn}')" title="Edit Buyer">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-delete" onclick="confirmDeleteBuyer('${buyer.ntn}')" title="Delete Buyer">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Update pagination info and controls
  const paginationInfo = document.getElementById('buyersPaginationInfo');
  if (paginationInfo) {
    const perPageText = perPage === 'all' ? 'All' : perPage;
    if (perPage === 'all') {
      paginationInfo.innerHTML = `Showing <select id="buyersPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all" selected>All</option></select> of ${filteredBuyers.length} items`;
    } else {
      paginationInfo.innerHTML = `Showing <select id="buyersPerPage" class="per-page-select"><option value="1"${perPage==='1'?' selected':''}>1</option><option value="10"${perPage==='10'?' selected':''}>10</option><option value="20"${perPage==='20'?' selected':''}>20</option><option value="50"${perPage==='50'?' selected':''}>50</option><option value="100"${perPage==='100'?' selected':''}>100</option><option value="all">All</option></select> of ${paginatedData.totalItems} items`;
    }
    // Attach event listener after updating HTML
    attachPerPageListeners();
  }
  
  createPaginationControls('buyersPaginationControls', paginatedData.currentPage, paginatedData.totalPages, (page) => {
    currentBuyersPage = page;
    populateBuyersTable();
  });
  
  // Populate province filter options
  populateBuyerProvinceFilter(await dbGetAll(STORE_NAMES.buyers));
}

// Populate province filter dropdown
function populateBuyerProvinceFilter(buyers) {
  const provinceFilter = document.getElementById('buyerProvinceFilter');
  if (!provinceFilter) return;
  
  const provinces = [...new Set(buyers.map(b => b.province).filter(Boolean))];
  
  // Keep the current selection
  const currentValue = provinceFilter.value;
  
  provinceFilter.innerHTML = '<option value="all">All Provinces</option>';
  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceFilter.appendChild(option);
  });
  
  // Restore selection
  provinceFilter.value = currentValue;
}

// Initialize buyer filters
function initBuyerFilters() {
  const searchInput = document.getElementById('buyerSearch');
  const provinceFilter = document.getElementById('buyerProvinceFilter');
  const regTypeFilter = document.getElementById('buyerRegTypeFilter');
  const statusFilter = document.getElementById('buyerStatusFilter');

  // Handle search input
  searchInput?.addEventListener('input', debounce(() => {
    currentBuyersPage = 1;
    populateBuyersTable();
  }, 300));

  // Handle filters
  [provinceFilter, regTypeFilter, statusFilter].forEach(filter => {
    filter?.addEventListener('change', () => {
      currentBuyersPage = 1;
      populateBuyersTable();
    });
  });
}


async function addNewItem() {
  const itemId = `item-${itemCounter++}`

  const item = {
    id: itemId,
    hsCode: "",
    description: "",
    serviceTypeId: "",
    saleType: "",
    uom: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
    extraTax: 0,
    furtherTax: 0,
    discount: 0,
    fedPayable: 0,
    salesTaxWithheldAtSource: 0,
    rateId: null,
    sroSchedule: "",
    sroItem: "",
    uomOptions: [],
    taxRateOptions: [],
    sroScheduleOptions: [],
    sroItemOptions: [],
    annexureId: 3,
  }

  items.push(item)
  renderItems()
  updateInvoiceTotal()
}

async function updateItem(itemId, field, value) {

  console.log("updateItem", itemId, field, value)

  const item = items.find((item) => item.id === itemId)
  if (!item) return

  const selectedBuyer = await getSelectedBuyer()

  if (field === "hsCode") {
    const selectedHsCode = hsCodes.find((hs) => hs.hS_CODE === value)
    item.hsCode = value
    item.description = selectedHsCode ? selectedHsCode.description : item.description
    item.uomOptions = await fetchUoMOptions(value, 3)
    item.uom = item.uomOptions.length > 0 ? item.uomOptions[0] : ""
    item.taxRateOptions = []
    item.sroScheduleOptions = []
    item.sroItemOptions = []
    item.taxRate = 0
    item.rateId = null
    item.sroSchedule = ""
    item.sroItem = ""
    showToast("success", "HS Code Updated", "UoM options refreshed")
  } else if (field === "saleType") {
    const selectedTransType = transactionTypes.find((t) => t.transactioN_TYPE_ID == value)
    item.serviceTypeId = Number.parseInt(value)
    item.saleType = selectedTransType ? selectedTransType.transactioN_DESC : item.saleType

    
    
    if (selectedBuyer) {
      const date = DOMElements.invoiceDate.value || new Date().toISOString().split("T")[0]

      item.taxRateOptions = await fetchTaxRateOptions(item.serviceTypeId, selectedBuyer.province, date)
      item.taxRate = item.taxRateOptions.length > 0 ? item.taxRateOptions[0].ratE_VALUE : 0
      item.rateId = item.taxRateOptions.length > 0 ? item.taxRateOptions[0].ratE_ID : null
      item.sroScheduleOptions = []
      item.sroItemOptions = []
      item.sroSchedule = ""
      item.sroItem = ""
      showToast("success", "Sale Type Updated", "Tax rates loaded")
    }
  } else if (field === "taxRate") {
    item.taxRate = Number.parseFloat(value)
    const selectedTaxRate = item.taxRateOptions.find((rate) => rate.ratE_VALUE == value)
    item.rateId = selectedTaxRate ? selectedTaxRate.ratE_ID : null

    if (item.rateId) {
      const date = DOMElements.invoiceDate.value || new Date().toISOString().split("T")[0]
      const province = provinces.find((p) => p.stateProvinceDesc === selectedBuyer.province)
      const provinceCode = province ? province.stateProvinceCode : 1
      item.sroScheduleOptions = await fetchSroSchedules(item.rateId, date, provinceCode)
      item.sroSchedule = item.sroScheduleOptions.length > 0 ? item.sroScheduleOptions[0].srO_ID : ""
      item.sroItemOptions = item.sroSchedule ? await loadSROItems(item.sroSchedule, date) : []
      item.sroItem = item.sroItemOptions.length > 0 ? item.sroItemOptions[0].srO_ITEM_ID : ""
      showToast("success", "Tax Rate Selected", "SRO options loaded")
    } else {
      item.sroScheduleOptions = []
      item.sroItemOptions = []
      item.sroSchedule = ""
      item.sroItem = ""
    }
  } else if (field === "sroSchedule") {
    item.sroSchedule = Number.parseInt(value)
    const date = DOMElements.invoiceDate.value || new Date().toISOString().split("T")[0]
    item.sroItemOptions = await loadSROItems(item.sroSchedule, date)
    item.sroItem = item.sroItemOptions.length > 0 ? item.sroItemOptions[0].srO_ITEM_ID : ""
    showToast("success", "SRO Schedule Selected", "SRO Items loaded")
  } else {
    item[field] = ["quantity", "unitPrice", "extraTax", "furtherTax", "discount", "fedPayable", "salesTaxWithheldAtSource", "sroItem"].includes(field)
      ? field === "sroItem"
        ? value
        : Number.parseFloat(value)
      : value
  }

  renderItems()
  updateInvoiceTotal()
}

function removeItem(itemId) {
  if (items.length <= 1) {
    showToast("warning", "Cannot Remove", "At least one item must remain in the invoice")
    return
  }
  items = items.filter((item) => item.id !== itemId)
  renderItems()
  updateInvoiceTotal()
}

function renderItems() {
  const container = DOMElements.itemsBody
  container.innerHTML = ""

  items.forEach((item, index) => {
    const value = item.quantity * item.unitPrice
    const salesTaxApplicable = (value * item.taxRate) / 100
    const extraTax = item.extraTax || 0
    const furtherTax = item.furtherTax || 0
    const discount = item.discount || 0
    const total = value + salesTaxApplicable + extraTax + furtherTax - discount
    const totalTax = salesTaxApplicable + extraTax + furtherTax

    // Define color schemes for each item with lighter colors for better text visibility
    const itemColors = [
      { header1: "#bbdefb", data1: "#e3f2fd", header2: "#c5cae9", data2: "#e8eaf6" },
      { header1: "#e1bee7", data1: "#f3e5f5", header2: "#ce93d8", data2: "#f3e5f5" },
      { header1: "#c8e6c9", data1: "#e8f5e8", header2: "#a5d6a7", data2: "#e8f5e8" },
      { header1: "#ffcc80", data1: "#fff3e0", header2: "#ffcc80", data2: "#fff3e0" }
    ]
    const colors = itemColors[index % itemColors.length]

    // Transaction Type dropdown
    const transactionTypeOptions = transactionTypes
      .map(
        (t) =>
          `<option value="${t.transactioN_TYPE_ID}" ${item.serviceTypeId == t.transactioN_TYPE_ID ? "selected" : ""}>${t.transactioN_DESC}</option>`,
      )
      .join("")

    // UOM dropdown
    const uomOptions = item.uomOptions
      ? item.uomOptions
          .map((uom) => `<option value="${uom}" ${item.uom === uom ? "selected" : ""}>${uom}</option>`)
          .join("")
      : `<option value="${item.uom}" ${item.uom || ""}>${item.uom || ""}</option>`

    // Tax Rate dropdown
    const taxRateOptions =
      item.taxRateOptions && item.taxRateOptions.length > 0
        ? item.taxRateOptions
            .map(
              (rate) =>
                `<option value="${rate.ratE_VALUE}" data-rate-id="${rate.ratE_ID}" ${item.taxRate == rate.ratE_VALUE ? "selected" : ""}>${rate.ratE_DESC}</option>`,
            )
            .join("")
        : `<option value="">Select Sale Type First</option>`

    // SRO Schedule dropdown - disabled until tax rate is selected
    const sroScheduleDisabled = !item.rateId || !item.sroScheduleOptions || item.sroScheduleOptions.length === 0
    const sroScheduleOptions =
      item.sroScheduleOptions && item.sroScheduleOptions.length > 0
        ? item.sroScheduleOptions
            .map(
              (sro) =>
                `<option value="${sro.srO_ID}" ${item.sroSchedule == sro.srO_ID ? "selected" : ""}>${sro.srO_DESC}</option>`,
            )
            .join("")
        : '<option value="">Select Tax Rate First</option>'

    // SRO Item dropdown - disabled until SRO schedule is selected
    const sroItemDisabled = !item.sroSchedule || !item.sroItemOptions || item.sroItemOptions.length === 0
    const sroItemOptions =
      item.sroItemOptions && item.sroItemOptions.length > 0
        ? item.sroItemOptions
            .map(
              (sroItem) =>
                `<option value="${sroItem.srO_ITEM_ID}" ${item.sroItem == sroItem.srO_ITEM_ID ? "selected" : ""}>${sroItem.srO_ITEM_DESC}</option>`,
            )
            .join("")
        : '<option value="">Select SRO Schedule First</option>'

    // Create individual container for each line item
    const itemContainer = document.createElement("div")
    itemContainer.className = "line-item-container"
    itemContainer.style.backgroundColor = colors.data1
    itemContainer.style.borderRadius = "8px"
    itemContainer.style.marginBottom = "12px"
    itemContainer.style.padding = "4px"
    itemContainer.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)"
    
    const itemTable = document.createElement("table")
    itemTable.className = "item-table"
    itemTable.style.width = "100%"
    itemTable.style.borderCollapse = "separate"
    itemTable.style.borderSpacing = "0"
    
    const commonStyle = "width: 100%; padding: 2px; font-size: 0.90rem;"
    
    // First header row for this item
    const firstHeaderRow = document.createElement("tr")
    firstHeaderRow.className = "item-first-header"
    firstHeaderRow.style.backgroundColor = colors.header1
    firstHeaderRow.style.fontWeight = "bold"
    firstHeaderRow.innerHTML = `
      <th>Search Product</th>
      <th>HS Code</th>
      <th>Product Name</th>
      <th>Service Type</th>
      <th>Quantity</th>
      <th>UoM</th>
      <th>Unit Price</th>
      <th>Tax Rate</th>
      <th>Tax Amount</th>
      <th>Total Value</th>
      <th style="padding: 5px; text-align: center;">Actions</th>
    `
    itemTable.appendChild(firstHeaderRow)

    // First data row with basic item details
    const firstDataRow = document.createElement("tr")
    firstDataRow.className = "item-first-data"
    firstDataRow.style.backgroundColor = "transparent"
    firstDataRow.innerHTML = `
      <td style="width: 120px; position: relative;">
        <input type="text" 
               class="product-search-input"
               placeholder="Search..."
               onfocus="showProductSuggestions('${item.id}')"
               onkeyup="debounceProductSearch('${item.id}', this.value)"
               style="${commonStyle}">
        <div id="productSuggestions-${item.id}" class="product-suggestions" 
        style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: white; border: 1px solid #ddd; max-height: 300px; overflow-y: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: 250px;"></div>
      </td>
      <td style="width: 120px; position: relative;">
        <input type="text" 
               class="hs-code-input"
               value="${item.hsCode}" 
               placeholder="Search HS Code..."
               title="${item.description}"
               onkeyup="debounceHSCodeSearch('${item.id}', this.value)"
               style="${commonStyle}">
        <div id="hsCodeSuggestions-${item.id}" class="hs-suggestions" style="display: none;"></div>
      </td>
      <td>
        <textarea rows="1" onchange="updateItem('${item.id}', 'description', this.value)" readonly style="${commonStyle}; resize: vertical; border: none; border-radius: 5px;">${item.description}</textarea>
      </td>
      <td>
        <select onchange="updateItem('${item.id}', 'saleType', this.value)" 
        style="${commonStyle}">
          ${transactionTypeOptions}
        </select>
      </td>
      <td>
        <input type="number" value="${item.quantity}" min="1" 
          onchange="updateItem('${item.id}', 'quantity', this.value)" style="${commonStyle}">
      </td>
      <td>
        <select onchange="updateItem('${item.id}', 'uom', this.value)" 
        style="${commonStyle}">
          ${uomOptions}
        </select>
      </td>
      <td>
        <input type="number" value="${item.unitPrice}" min="0.01" step="0.01" 
          onchange="updateItem('${item.id}', 'unitPrice', this.value)" style="${commonStyle}">
      </td>
      <td>
        <select onchange="updateItem('${item.id}', 'taxRate', this.value)" 
        style=style="${commonStyle}" ${!item.taxRateOptions || item.taxRateOptions.length === 0 ? "disabled" : ""}>
          ${taxRateOptions}
        </select>
      </td>
      <td style="font-weight: bold; color: var(--fbr-green); vertical-align: middle; text-align: center;">${salesTaxApplicable.toFixed(2)}</td>
      <td rowspan="3" style="font-weight: bold; color: var(--fbr-blue); vertical-align: middle; text-align: center;">${total.toFixed(2)}</td>
      <td rowspan="3" style="font-weight: bold; vertical-align: middle; text-align: center;">
        <button class="btn btn-sm btn-danger" onclick="removeItem('${item.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `
    itemTable.appendChild(firstDataRow)

    // Second header row for this item
    const secondHeaderRow = document.createElement("tr")
    secondHeaderRow.className = "item-second-header"
    secondHeaderRow.style.backgroundColor = colors.header2
    secondHeaderRow.style.fontWeight = "bold"
    secondHeaderRow.innerHTML = `
      <th>SRO Schedule</th>
      <th>SRO Item Serial</th>
      <th>Annexure ID</th>
      <th>Extra Tax</th>
      <th>Further Tax</th>
      <th>Discount</th>
      <th>FED Payable</th>
      <th>Tax Withheld</th>
      
      <th>Total Tax</th>
    `
    itemTable.appendChild(secondHeaderRow)

    // Second data row for additional tax fields and SRO details
    const secondDataRow = document.createElement("tr")
    secondDataRow.className = "item-second-data"
    secondDataRow.style.backgroundColor = "transparent"
    secondDataRow.innerHTML = `
    <td style="padding: 2px;">
        <select onchange="updateItem('${item.id}', 'sroSchedule', this.value)" 
                style="${commonStyle}" 
                ${sroScheduleDisabled ? "disabled" : ""}>
          <option value="">Select SRO Schedule</option>
          ${sroScheduleOptions}
        </select>
      </td>
      <td style="padding: 2px;">
        <select onchange="updateItem('${item.id}', 'sroItem', this.value)" 
                style="${commonStyle}" 
                ${sroItemDisabled ? "disabled" : ""}>
          <option value="">Select SRO Item</option>
          ${sroItemOptions}
        </select>
      </td>
      <td style="padding: 2px;">
        <input type="number" value="${item.annexureId || 3}" min="1" readonly
          style="${commonStyle} background: #e9ecef;" 
          title="Fixed at 3 for UoM fetching">
      </td>
      <td>
        <input type="number" value="${item.extraTax || 0}" min="0" step="0.01" 
          onchange="updateItem('${item.id}', 'extraTax', this.value)" style="${commonStyle}">
      </td>
      <td style="padding: 2px;">
        <input type="number" value="${item.furtherTax || 0}" min="0" step="0.01" 
          onchange="updateItem('${item.id}', 'furtherTax', this.value)" style="${commonStyle}">
      </td>
      <td style="padding: 2px;">
        <input type="number" value="${item.discount || 0}" min="0" step="0.01" 
          onchange="updateItem('${item.id}', 'discount', this.value)" style="${commonStyle}">
      </td>
      <td style="padding: 2px;">
        <input type="number" value="${item.fedPayable || 0}" min="0" step="0.01" 
          onchange="updateItem('${item.id}', 'fedPayable', this.value)" style="${commonStyle}">
      </td>
      <td style="padding: 2px;">
        <input type="number" value="${item.salesTaxWithheldAtSource || 0}" min="0" step="0.01" 
          onchange="updateItem('${item.id}', 'salesTaxWithheldAtSource', this.value)" style="${commonStyle}">
      </td>
      
      <td style="font-weight: bold; color: var(--fbr-dark); padding: 2px; font-size: 0.8rem; text-align: center;">${totalTax.toFixed(2)}</td>
    `
    itemTable.appendChild(secondDataRow)
    
    // Append table to item container and container to main container
    itemContainer.appendChild(itemTable)
    container.appendChild(itemContainer)
  })
}

// Global functions for HTML onclick handlers
window.updateItem = updateItem
window.removeItem = removeItem

// --- Invoice Management: View & Edit ---
window.viewInvoice = async (invoiceId) => {
  try {
    
    const invoice = await dbGet(STORE_NAMES.invoices, String(invoiceId));
    if (!invoice) {
      console.error('Invoice not found for ID:', invoiceId);
      return showToast('error', 'Invoice Not Found', 'No invoice found for viewing.');
    }
    
    console.log('Invoice data loaded:', invoice);
    
    // Store the invoice for preview
    window.currentInvoiceData = invoice;
    lastSubmissionResponse = invoice;
    
    // Show the preview modal first to avoid timing issues
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
      previewModal.classList.add('active');
    }
    
    // Generate the preview using the same function as the PDF generation
    // This ensures consistency between preview and PDF output
    generateInvoicePDF(invoice, invoice.status === 'draft', true);
    
  } catch (e) {
    console.error('Error viewing invoice:', e);
    showToast('error', 'View Invoice Failed', e.message || e);
  }
};

window.editInvoice = async (invoiceId) => {
  try {
    const invoice = await dbGet(STORE_NAMES.invoices, String(invoiceId));
    if (!invoice) return showToast('error', 'Invoice Not Found', 'No invoice found for editing.');
    if (invoice.status === 'submitted') {
      showToast('warning', 'Edit Not Allowed', 'Submitted invoices cannot be edited.');
      return;
    }
    
    // Set edit state
    currentEditingInvoice = { ...invoice };
    originalInvoiceState = JSON.parse(JSON.stringify(invoice));
    
    // Switch to the Create Invoice tab first
    switchToCreateInvoiceTab();
    
    // Keep the original invoice reference for editing in place
    // Don't generate a new reference number
    
    // Load invoice data into the Create Invoice form for editing
    await loadInvoiceIntoForm(invoice);
    
    // Update UI to show edit state
    updateEditStateUI(true);
    
    showToast('info', 'Edit Draft', 'Draft invoice loaded for editing.');
  } catch (e) {
    showToast('error', 'Edit Invoice Failed', e.message || e);
  }
};
// Duplicate invoice function
window.duplicateInvoice = async (invoiceId) => {
  try {
    const invoice = await dbGet(STORE_NAMES.invoices, String(invoiceId))
    if (!invoice) {
      showToast('error', 'Invoice Not Found', 'No invoice found for duplication.')
      return
    }
    
    // Switch to create invoice tab
    switchToCreateInvoiceTab()
    
    // Load invoice data but generate new reference
    await loadInvoiceIntoForm(invoice)
    
    // Clear editing state to make it a new invoice
    currentEditingInvoice = null
    originalInvoiceState = null
    
    // Generate new reference number
    await updateInvoiceReference()
    
    // Update UI
    updateEditStateUI(false)
    
    showToast('success', 'Invoice Duplicated', 'Invoice has been duplicated for editing.')
  } catch (e) {
    showToast('error', 'Duplicate Failed', e.message || e)
  }
}

// Duplicate invoice function
window.duplicateInvoice = async (invoiceId) => {
  try {
    const invoice = await dbGet(STORE_NAMES.invoices, String(invoiceId));
    if (!invoice) {
      showToast('error', 'Error', 'Invoice not found');
      return;
    }
    
    // Create a deep copy of the invoice
    const newInvoice = JSON.parse(JSON.stringify(invoice));
    
    // Reset fields for the new invoice
    delete newInvoice.id;
    newInvoice.status = 'draft';
    newInvoice.createdAt = new Date().toISOString();
    newInvoice.updatedAt = new Date().toISOString();
    
    // Generate a new reference number
    const seller = await dbGet(STORE_NAMES.sellers, newInvoice.sellerNTNCNIC);
    if (seller) {
      newInvoice.invoiceRefNo = await getNextInvoiceRef(seller.ntn, newInvoice.invoiceType);
      newInvoice.invoiceRef = newInvoice.invoiceRefNo; // For backward compatibility
    }
    
    // Save the new invoice
    await dbSet(STORE_NAMES.invoices, newInvoice);
    
    // Update the UI
    await populateInvoicesTable();
    
    // Switch to the create invoice tab with the duplicated invoice
    switchToCreateInvoiceTab();
    await loadInvoiceIntoForm(newInvoice);
    
    showToast('success', 'Invoice Duplicated', 'A new draft has been created from the selected invoice');
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    showToast('error', 'Error', 'Failed to duplicate invoice');
  }
};


let hsCodeSearchTimeout
window.debounceHSCodeSearch = (itemId, searchTerm) => {
  clearTimeout(hsCodeSearchTimeout)
  hsCodeSearchTimeout = setTimeout(() => {
    searchHSCodes(itemId, searchTerm)
  }, 250) // half second debounce
}

// Product search functionality
let productSearchTimeout
window.debounceProductSearch = (itemId, searchTerm) => {
  clearTimeout(productSearchTimeout)
  productSearchTimeout = setTimeout(() => {
    searchProductsForItem(itemId, searchTerm)
  }, 250)
}

window.showProductSuggestions = async (itemId) => {
  const suggestionsDiv = document.getElementById(`productSuggestions-${itemId}`)
  if (!suggestionsDiv) return
  
  // Show loading state
  suggestionsDiv.innerHTML = '<div style="padding: 8px; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>'
  suggestionsDiv.style.display = 'block'
  
  // Load recent products or show all
  const products = await dbGetAll(STORE_NAMES.products)
  if (products.length === 0) {
    suggestionsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #666; font-style: italic;">No products found. <a href="#" onclick="switchToProductsTab()" style="color: var(--fbr-blue); text-decoration: none;">Add products first</a></div>'
    return
  }
  
  // Show first 5 products as suggestions
  const recentProducts = products.slice(0, 5)
  displayProductSuggestions(itemId, recentProducts)
}

async function searchProductsForItem(itemId, searchTerm) {
  const suggestionsDiv = document.getElementById(`productSuggestions-${itemId}`)
  if (!suggestionsDiv) return
  
  if (!searchTerm || searchTerm.length < 1) {
    await showProductSuggestions(itemId)
    return
  }
  
  const products = await dbGetAll(STORE_NAMES.products)
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (product.productName || '').toLowerCase().includes(searchLower) ||
      (product.hsCode || '').toLowerCase().includes(searchLower) ||
      (product.description || '').toLowerCase().includes(searchLower) ||
      (product.productType || '').toLowerCase().includes(searchLower)
    )
  }).slice(0, 10)
  
  if (filteredProducts.length === 0) {
    suggestionsDiv.innerHTML = '<div style="padding: 8px; text-align: center; color: #666;">No products found</div>'
    suggestionsDiv.style.display = 'block'
    return
  }
  
  displayProductSuggestions(itemId, filteredProducts)
}

function displayProductSuggestions(itemId, products) {
  const suggestionsDiv = document.getElementById(`productSuggestions-${itemId}`)
  if (!suggestionsDiv) return
  
  suggestionsDiv.innerHTML = products
    .map(product => `
      <div onclick="selectProductForItem('${itemId}', '${product.id}')" 
           style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; hover: background-color: #f8f9fa;"
           onmouseover="this.style.backgroundColor='#f8f9fa'"
           onmouseout="this.style.backgroundColor='white'">
        <div style="font-weight: bold; color: #0052A5;">${product.productName || 'Unnamed Product'}</div>
        <div style="font-size: 0.8em; color: #666;">
          <span>HS: ${product.hsCode || 'N/A'}</span> | 
          <span>Type: ${product.productType || 'N/A'}</span> | 
          <span>Rate: PKR ${(product.saleRate || 0).toFixed(2)}</span>
        </div>
      </div>
    `)
    .join('')
  
  suggestionsDiv.style.display = 'block'
}

window.selectProductForItem = async (itemId, productId) => {
  try {
    // Hide suggestions
    const suggestionsDiv = document.getElementById(`productSuggestions-${itemId}`)
    if (suggestionsDiv) {
      suggestionsDiv.style.display = 'none'
    }
    
    // Clear the search input
    const parentTd = document.getElementById(`productSuggestions-${itemId}`).parentElement
    const searchInput = parentTd.querySelector('.product-search-input')
    if (searchInput) {
      searchInput.value = ''
    }
    
    // Remove the current item from the items array
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex !== -1) {
      items.splice(itemIndex, 1)
    }
    
    // Add the selected product using existing functionality
    await addProductToInvoiceFromTable(productId)
    
    showToast('success', 'Product Added', 'Product has been added to the invoice')
  } catch (error) {
    console.error('Error selecting product:', error)
    showToast('error', 'Error', 'Failed to add product: ' + error.message)
  }
}

// Function to switch to products tab
window.switchToProductsTab = () => {
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
  
  document.querySelector('[data-tab="products-tab"]').classList.add("active")
  document.getElementById("products-tab").classList.add("active")
}

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.product-search-input') && !e.target.closest('.product-suggestions')) {
    document.querySelectorAll('.product-suggestions').forEach(div => {
      div.style.display = 'none'
    })
  }
})

function searchHSCodes(itemId, searchTerm) {
  const suggestionsDiv = document.getElementById(`hsCodeSuggestions-${itemId}`)

  if (!searchTerm || searchTerm.length < 2) {
    if (suggestionsDiv) suggestionsDiv.style.display = "none"
    return
  }

  if (!hsCodes || hsCodes.length === 0) {
    if (suggestionsDiv) suggestionsDiv.style.display = "none"
    return
  }

  const filteredCodes = hsCodes
    .filter(
      (hs) =>
        hs.hS_CODE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hs.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, 10)

  if (filteredCodes.length === 0) {
    if (suggestionsDiv) suggestionsDiv.style.display = "none"
    return
  }

  if (suggestionsDiv) {
    suggestionsDiv.innerHTML = filteredCodes
      .map(
        (hs) => `
      <div onclick="selectHSCode('${itemId}', '${hs.hS_CODE}', '${hs.description.replace(/'/g, "\\'")}')" 
           style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">
        <strong>${hs.hS_CODE}</strong><br>
        <small>${hs.description}</small>
      </div>
    `,
      )
      .join("")

    suggestionsDiv.style.display = "block"
  }
}

window.searchHSCodes = searchHSCodes

window.selectHSCode = (itemId, hsCode, description) => {
  updateItem(itemId, "hsCode", hsCode)
  const suggestionsDiv = document.getElementById(`hsCodeSuggestions-${itemId}`)
  if (suggestionsDiv) suggestionsDiv.style.display = "none"
}

function updateInvoiceTotal() {
  let subTotal = 0;
  let totalTax = 0;
  let totalExtraTax = 0;
  let totalFurtherTax = 0;
  let totalDiscount = 0;
  
  items.forEach((item) => {
    const value = item.quantity * item.unitPrice;
    const salesTaxApplicable = (value * item.taxRate) / 100;
    const extraTax = item.extraTax || 0;
    const furtherTax = item.furtherTax || 0;
    const discount = item.discount || 0;
    
    subTotal += value;
    totalTax += salesTaxApplicable;
    totalExtraTax += extraTax;
    totalFurtherTax += furtherTax;
    totalDiscount += discount;
  });
  
   grandTotal = subTotal + totalTax + totalExtraTax + totalFurtherTax - totalDiscount;
  
  // Update line item count
  const lineItemCountElement = document.getElementById("lineItemCount");
  if (lineItemCountElement) {
    lineItemCountElement.textContent = items.length;
  }
  
  // Update sub total
  const subTotalElement = document.getElementById("subTotal");
  if (subTotalElement) {
    subTotalElement.textContent = `${subTotal.toFixed(2)} PKR`;
  }
  
  // Update total tax
  const totalTaxElement = document.getElementById("totalTax");
  if (totalTaxElement) {
    totalTaxElement.textContent = `${(totalTax + totalExtraTax + totalFurtherTax).toFixed(2)} PKR`;
  }
  
  // Update grand total
  const invoiceTotalElement = document.getElementById("invoiceTotal");
  if (invoiceTotalElement) {
    invoiceTotalElement.textContent = `${grandTotal.toFixed(2)} PKR`;
  }
}

// Helper: Render invoice in preview modal
function renderInvoicePreview(invoice) {
  if (!invoice) return;
  
  // Store the current invoice data for JSON view
  window.currentInvoiceData = invoice;
  
  // Show the preview modal
  const previewModal = document.getElementById('previewModal');
  if (previewModal) {
    previewModal.classList.add('active');
  }
  
  // Generate the preview using the same function as the PDF generation
  generateInvoicePDF(invoice, true, true);
}

// Helper: Load invoice data into the Create Invoice form
async function loadInvoiceIntoForm(invoice) {
  // Set seller and buyer selects
  DOMElements.sellerSelect.value = invoice.sellerNTNCNIC || invoice.seller?.ntn || '';
  DOMElements.buyerSelect.value = invoice.buyerNTNCNIC || invoice.buyer?.ntn || '';
  DOMElements.invoiceDate.value = invoice.invoiceDate || invoice.dated || '';
  DOMElements.invoiceType.value = invoice.invoiceType || '';
  DOMElements.scenarioId.value = invoice.scenarioId || '';
  DOMElements.currency.value = invoice.currency || '';
  
  // Ensure invoice ID is properly handled as string
  if (invoice.id) {
    currentEditingInvoice = { ...invoice, id: invoice.id.toString() };
  }
  DOMElements.invoiceRef.value = invoice.invoiceRefNo || invoice.invoiceRef || '';
  
  // Clear existing items and load invoice items
  items = [];
  itemCounter = 0;
  
  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      const newItem = {
        id: `item-${itemCounter++}`,
        hsCode: item.hsCode || '',
        description: item.productDescription || item.description || '',
        serviceTypeId: parseInt(item.serviceTypeId) || 18,
        saleType: item.saleType || 'Services',
        uom: item.uoM || item.uom || '',
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        taxRate: parseFloat(item.taxRate) || parseFloat(item.rate) || 0,
        extraTax: parseFloat(item.extraTax) || 0,
        furtherTax: parseFloat(item.furtherTax) || 0,
        discount: parseFloat(item.discount) || 0,
        fedPayable: parseFloat(item.fedPayable) || 0,
        salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource) || 0,
        rateId: item.rateId || null,
        sroSchedule: item.sroSchedule || '',
        sroItem: item.sroItem || '',
        uomOptions: item.uom ? [item.uom] : [],
        taxRateOptions: item.taxRate ? [{ ratE_VALUE: item.taxRate, ratE_DESC: `${item.taxRate}%`, ratE_ID: item.rateId }] : [],
        sroScheduleOptions: [],
        sroItemOptions: [],
        annexureId: 3
      };
      items.push(newItem);
    }
  } else {
    // Add a default item if no items exist
    await addNewItem();
    return;
  }
  
  renderItems();
  updateInvoiceTotal();
  
  // Trigger form updates
  setTimeout(async () => {
    if (DOMElements.sellerSelect.value) {
      await populateInvoiceScenarios(DOMElements.sellerSelect.value, invoice.scenarioId);
    }
    if (DOMElements.buyerSelect.value) {
      DOMElements.buyerSelect.dispatchEvent(new Event('change'));
    }
    await updateInvoiceReference();
  }, 100);
}

// Retry submission function
// window.retrySubmission = () => {
//   DOMElements.invoiceResult.style.display = "none"
//   DOMElements.submitBtn.click()
// }

// Modal functions
function initModals() {
  // Buyer Modal
  const buyerModal = DOMElements.buyerModal
  const addBuyerBtn = document.getElementById("addBuyerBtn")
  const addBuyerModalBtn = document.getElementById("addBuyerModalBtn")
  const closeBuyerModal = document.getElementById("closeBuyerModal")
  const cancelBuyerBtn = document.getElementById("cancelBuyerBtn")
  const saveBuyerBtn = document.getElementById("saveBuyerBtn")
  const buyerForm = document.getElementById("buyerForm")
  const buyerModalTitle = DOMElements.buyerModalTitle

  // Safety check for required elements
  if (!buyerModal || !buyerForm || !buyerModalTitle) {
    console.warn('Buyer modal elements not found, skipping buyer modal initialization');
    return;
  }

  if (addBuyerBtn) {
    addBuyerBtn.addEventListener("click", () => {
      currentEditingBuyer = null
      buyerForm.reset()
      buyerModalTitle.textContent = "Add New Buyer"
      const errorEl = document.getElementById("buyerModalError");
      if (errorEl) errorEl.classList.remove("show")
      buyerModal.classList.add("active")
    })
  }

  // Check if addBuyerModalBtn exists before adding event listener
  if (addBuyerModalBtn) {
    addBuyerModalBtn.addEventListener("click", () => {
      currentEditingBuyer = null
      buyerForm.reset()
      buyerModalTitle.textContent = "Add New Buyer"
      const errorEl = document.getElementById("buyerModalError");
      if (errorEl) errorEl.classList.remove("show")
      buyerModal.classList.add("active")
    })
  }

  if (closeBuyerModal) {
    closeBuyerModal.addEventListener("click", () => buyerModal.classList.remove("active"))
  }
  
  if (cancelBuyerBtn) {
    cancelBuyerBtn.addEventListener("click", () => buyerModal.classList.remove("active"))
  }

  // Success Modal close handlers
  const successModalCloseBtn = DOMElements.closeSuccessModal;
  
  
  // Error Modal event handlers
  if (DOMElements.closeErrorModal) {
    DOMElements.closeErrorModal.addEventListener('click', () => {
      DOMElements.errorModal.classList.remove('active');
    });
  }
  
  if (DOMElements.closeErrorModalBtn) {
    DOMElements.closeErrorModalBtn.addEventListener('click', () => {
      DOMElements.errorModal.classList.remove('active');
    });
  }
  
  if (DOMElements.retrySubmissionBtn) {
    DOMElements.retrySubmissionBtn.addEventListener('click', () => {
      // Hide error modal
      DOMElements.errorModal.classList.remove('active');
      // Hide any error display
      if (DOMElements.invoiceResult) {
        DOMElements.invoiceResult.style.display = "none";
      }
      // Trigger submission again
      if (DOMElements.submitBtn) {
        DOMElements.submitBtn.click();
      }
    });
  }
  const successModalCloseFooterBtn = document.getElementById("closeSuccessModalBtn");
  
  const closeSuccessModalHandler = async () => {
    DOMElements.successModal.classList.remove("active");
    
    // Clear the success modal content
    const respContainer = DOMElements.successResponseData;
    if (respContainer) {
      respContainer.innerHTML = '';
    }
    
    // Reset the form to initial state
    // await resetToInitialState();
    
    // Show the create invoice tab
    switchToCreateInvoiceTab();
  };
  
  if (successModalCloseBtn) successModalCloseBtn.addEventListener("click", closeSuccessModalHandler);
  if (successModalCloseFooterBtn) successModalCloseFooterBtn.addEventListener("click", closeSuccessModalHandler);

  // Buyer field event listeners with safety checks
  if (DOMElements.buyerNTN) {
    DOMElements.buyerNTN.addEventListener("blur", async (event) => {
      const ntn = event.target.value
      if (!ntn) return

      const existingBuyers = await dbGetAll(STORE_NAMES.buyers)
      const exists = existingBuyers.some(
        (buyer) => buyer.ntn === ntn && (!currentEditingBuyer || buyer.id !== currentEditingBuyer.id),
      )

      if (exists) {
        showModalError("buyerModal", "A buyer with this NTN/CNIC already exists!")
        event.target.focus()
        return
      }

      const { status } = await validateRegistration(ntn)
      if (DOMElements.buyerStatus) DOMElements.buyerStatus.value = status

      const { type } = await getRegistrationType(ntn)
      if (DOMElements.buyerRegType) DOMElements.buyerRegType.value = type
    })
  }

  if (saveBuyerBtn) {
    saveBuyerBtn.addEventListener("click", async () => {
      const buyers = await dbGetAll(STORE_NAMES.buyers)
      const newBuyer = {
        id: currentEditingBuyer ? currentEditingBuyer.id : Date.now().toString(),
        ntn: DOMElements.buyerNTN?.value || '',
        businessName: DOMElements.buyerBusinessName?.value || '',
        registrationType: DOMElements.buyerRegType?.value || '',
        province: DOMElements.buyerProvince?.value || '',
        address: DOMElements.buyerAddress?.value || '',
        registrationStatus: DOMElements.buyerStatus?.value || '',
      }

      if (currentEditingBuyer) {
        const index = buyers.findIndex((buyer) => buyer.id === currentEditingBuyer.id)
        if (index !== -1) {
          buyers[index] = newBuyer
        }
      } else {
        buyers.push(newBuyer)
      }

      await dbSetAll(STORE_NAMES.buyers, buyers)
      if (typeof populateBuyerSelect === 'function') populateBuyerSelect()
      if (typeof populateBuyersTable === 'function') populateBuyersTable()
      buyerForm.reset()
      buyerModal.classList.remove("active")
      showToast("success", "Buyer Saved", "Buyer information saved successfully")
    })
  }

  // Seller Modal
  const sellerModal = DOMElements.sellerModal
  const addSellerBtn = document.getElementById("addSellerBtn")
  const closeSellerModal = document.getElementById("closeSellerModal")
  const cancelSellerBtn = document.getElementById("cancelSellerBtn")
  const saveSellerBtn = document.getElementById("saveSellerBtn")
  const sellerForm = document.getElementById("sellerForm")
  const sellerModalTitle = DOMElements.sellerModalTitle

  // Safety check for seller modal elements
  if (!sellerModal || !sellerForm) {
    console.warn('Seller modal elements not found, skipping seller modal initialization');
  } else {
    if (addSellerBtn) {
      addSellerBtn.addEventListener("click", () => {
        currentEditingSeller = null
        sellerForm.reset()
        if (sellerModalTitle) sellerModalTitle.textContent = "Add New Seller"
        const errorEl = document.getElementById("sellerModalError");
        if (errorEl) errorEl.classList.remove("show")
        if (DOMElements.scenarioChips) DOMElements.scenarioChips.innerHTML = ""
        if (DOMElements.sellerScenarioIds) DOMElements.sellerScenarioIds.value = ""
        sellerModal.classList.add("active")
      })
    }

    if (closeSellerModal) {
      closeSellerModal.addEventListener("click", () => sellerModal.classList.remove("active"))
    }
    
    if (cancelSellerBtn) {
      cancelSellerBtn.addEventListener("click", () => sellerModal.classList.remove("active"))
    }

    // Business Activity change handler
    if (DOMElements.sellerBusinessActivity) {
      DOMElements.sellerBusinessActivity.addEventListener("change", function () {
        if (typeof populateSectorOptions === 'function') populateSectorOptions(this.value)
        if (DOMElements.sellerSector) DOMElements.sellerSector.value = ""
        if (DOMElements.sellerScenarioSelect) {
          DOMElements.sellerScenarioSelect.innerHTML = '<option value="">Select Scenario to Add</option>'
        }
      })
    }

    // Sector change handler
    if (DOMElements.sellerSector) {
      DOMElements.sellerSector.addEventListener("change", function () {
        const businessActivity = DOMElements.sellerBusinessActivity?.value
        if (businessActivity && this.value && typeof populateScenarioOptions === 'function') {
          populateScenarioOptions(businessActivity, this.value)
        }
      })
    }

    // Scenario selection handler
    if (DOMElements.sellerScenarioSelect) {
      DOMElements.sellerScenarioSelect.addEventListener("change", function () {
        if (this.value && typeof addScenarioChip === 'function') {
          addScenarioChip(this.value)
          this.value = ""
        }
      })
    }
  }

  // Seller NTN field event listener with safety check
  if (DOMElements.sellerNTN) {
    DOMElements.sellerNTN.addEventListener("blur", async (event) => {
      const ntn = event.target.value
      if (!ntn) return

      const existingSellers = await dbGetAll(STORE_NAMES.sellers)
      const exists = existingSellers.some(
        (seller) => seller.ntn === ntn && (!currentEditingSeller || seller.id !== currentEditingSeller.id),
      )

      if (exists) {
        showModalError("sellerModal", "A seller with this NTN already exists!")
        event.target.focus()
        return
      }

      const sandboxToken = DOMElements.sellerSandboxToken?.value
      const productionToken = DOMElements.sellerProductionToken?.value
      const token = sandboxToken || productionToken

      if (token) {
        const { status } = await validateRegistration(ntn, token)
        if (DOMElements.sellerRegStatus) DOMElements.sellerRegStatus.value = status

        const { type } = await getRegistrationType(ntn, token)
        if (DOMElements.sellerRegType) DOMElements.sellerRegType.value = type
      }
    })
  }

  if (saveSellerBtn && sellerForm && sellerModal) {
    saveSellerBtn.addEventListener("click", async () => {
      const newSeller = {
        id: currentEditingSeller ? currentEditingSeller.id : Date.now().toString(),
        ntn: DOMElements.sellerNTN?.value || '',
        businessName: DOMElements.sellerBusinessName?.value || '',
        businessActivity: DOMElements.sellerBusinessActivity?.value || '',
        sector: DOMElements.sellerSector?.value || '',
        scenarioIds: document.getElementById("sellerScenarioIds")?.value.split(",").filter((id) => id.trim()) || [],
        province: DOMElements.sellerProvince?.value || '',
        address: DOMElements.sellerAddress?.value || '',
        sandboxToken: DOMElements.sellerSandboxToken?.value || '',
        productionToken: DOMElements.sellerProductionToken?.value || '',
        registrationStatus: DOMElements.sellerRegStatus?.value || '',
        registrationType: DOMElements.sellerRegType?.value || '',
        lastSaleInvoiceId: Number.parseInt(DOMElements.sellerLastSaleInvoiceId?.value) || 1,
        lastDebitNoteId: Number.parseInt(DOMElements.sellerLastDebitNoteId?.value) || 1,
      };
      await dbSet(STORE_NAMES.sellers, newSeller);
      if (typeof populateSellerSelect === 'function') await populateSellerSelect();
      if (typeof populateSellersTable === 'function') await populateSellersTable();
      sellerForm.reset();
      sellerModal.classList.remove("active");
      showToast("success", "Seller Saved", "Seller information saved successfully");
    });
  }

  // JSON Modal
  const jsonModal = document.getElementById("jsonModal")
  const viewJsonBtn = document.getElementById("viewJsonBtn")
  const closeJsonModal = document.getElementById("closeJsonModal")
  const closeJsonModalBtn = document.getElementById("closeJsonModalBtn")
  const copyJsonBtn = document.getElementById("copyJsonBtn")
  const jsonPayload = document.getElementById("jsonPayload")

  // Safety checks for JSON modal elements
  if (viewJsonBtn && jsonModal) {
    viewJsonBtn.addEventListener("click", async () => {
      try {
        const seller = await getSelectedSeller()
        const buyer = await getSelectedBuyer()

        console.log("seller", seller)
        console.log("buyer", buyer)

        if (!seller) {
          showToast("error", "No Seller", "Please select a seller first")
          return
        }

        if (!buyer) {
          showToast("error", "No Buyer", "Please select a buyer first")
          return
        }

        const { payload } = await generateInvoiceJSON()
        if (jsonPayload) {
          jsonPayload.textContent = JSON.stringify(payload, null, 2)
        }
        jsonModal.classList.add("active")
      } catch (error) {
        console.error('Error in viewJsonBtn click handler:', error)
        showToast("error", "Error", "Failed to generate JSON preview")
      }
    })
  }

  if (closeJsonModal && jsonModal) {
    closeJsonModal.addEventListener("click", () => jsonModal.classList.remove("active"))
  }
  
  if (closeJsonModalBtn && jsonModal) {
    closeJsonModalBtn.addEventListener("click", () => jsonModal.classList.remove("active"))
  }
  
  if (copyJsonBtn && jsonPayload) {
    copyJsonBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(jsonPayload.textContent)
        .then(() => showToast("success", "Copied", "JSON copied to clipboard"))
        .catch(() => showToast("error", "Error", "Failed to copy JSON"))
    })
  }
}

  // Common layout configuration for both PDF and preview
  const layoutConfig = {
    margin: { top: 5, left: 10, right: 10, bottom: 10 },
    pageWidth: 210, // A4 width in mm
    pageHeight: 297, // A4 height in mm
    colWidths: [14, 22, 53, 13, 16, 20, 18, 18, 20], // Adjusted for description wrapping
    rowHeight: 7,
    headerBgColor: [230, 230, 230], // Grey background
    borderWidths: { top: 2, bottom: 2, left: 4, right: 2 }
  };
  
  
async function generateInvoicePDF(response, isDummy = false, isPreview = false) {
  // If no response is provided, use the lastSubmissionResponse
  if (!response) {
    response = lastSubmissionResponse;
  }
  if (!window.jspdf || !window.jspdf.jsPDF || !window.QRCode) {
    showToast("error", "PDF Error", "Required libraries (jsPDF or QRCode) not loaded");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Get data
  const seller = response?.seller || await getSelectedSeller();
  const buyer = response?.buyer || await getSelectedBuyer();
  const invoiceDate = formatDateForDisplay(response?.dated || response?.invoicePayload?.invoiceDate || DOMElements.invoiceDate.value);
  const invoiceRef = response?.invoiceRefNo || response?.invoicePayload?.invoiceRefNo || DOMElements.invoiceRef.value;
  const currency = response?.currency || DOMElements.currency.value;
  const invoiceNumber = response?.invoiceNumber ||  "N/A";
  const itemsList = response?.items || response?.invoicePayload?.items || items;


  // Function to wrap text
  const wrapText = (text, x, y, maxWidth, lineHeight = 5) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line, i) => doc.text(line, x, y + i * lineHeight));
    return lines.length * lineHeight;
  };

  // Generate content for both PDF and preview
  const generateContent = async () => {
    let y = layoutConfig.margin.top + 10;
    const x = layoutConfig.margin.left;

    // Header - Get sales type from invoice data
    const invoiceType = response?.invoiceType || response?.invoicePayload?.invoiceType || DOMElements.invoiceType?.value || 'Sale Invoice';
    const salesType = invoiceType.replace(' Invoice', '');
    
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    const headerText = `${salesType} Invoice`;
    const headerWidth = doc.getTextWidth(headerText);
    const wrappedHeaderHeight = wrapText(headerText, layoutConfig.pageWidth / 2 - headerWidth / 2, y, layoutConfig.pageWidth - 20);
    y += wrappedHeaderHeight + 5;

    // Logo and QR Code
    const logo = new Image();
    logo.src = "FBRDigitalInvoiceLogo.png";
    await new Promise(resolve => { logo.onload = resolve; });
    doc.addImage(logo, "PNG", x, layoutConfig.margin.top, 35, 20);

    // QR code at top right
    const qrText = invoiceNumber ;
    try {
      const qrUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H' });
      const qrWidth = 35;
      doc.addImage(
        qrUrl,
        "PNG",
        layoutConfig.pageWidth - layoutConfig.margin.right - qrWidth,
        layoutConfig.margin.top,
        qrWidth,
        qrWidth
      );
    } catch (err) {
      console.error("QR Code Error:", err);
    }

    // Invoice Info Section
    y += 20;
    const leftX = x, rightX = 120;
    let leftY = y, rightY = y;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Invoice Date:", leftX, leftY);
    doc.setFont(undefined, "normal");
    leftY += wrapText(invoiceDate, leftX + 32, leftY, 80);

    doc.setFont(undefined, "bold");
    doc.text("Payment Mode:", leftX, leftY);
    doc.setFont(undefined, "normal");
    const paymentMode = response?.paymentMode || document.getElementById('paymentMode')?.value || 'Cash';
    leftY += wrapText(paymentMode, leftX + 32, leftY, 80);

    doc.setFont(undefined, "bold");
    doc.text("Currency:", leftX, leftY);
    doc.setFont(undefined, "normal");
    leftY += wrapText(currency, leftX + 32, leftY, 80);

    doc.setFont(undefined, "bold");
    doc.text("Invoice Ref No.:", rightX, rightY);
    doc.setFont(undefined, "normal");
    rightY += wrapText(invoiceRef, rightX + 38, rightY, 60);

    doc.setFont(undefined, "bold");
    doc.text("FBR Invoice No.:", rightX, rightY);
    doc.setFont(undefined, "normal");
    rightY += wrapText(invoiceNumber, rightX + 38, rightY, 45);

    // Seller/Buyer Info
    y = Math.max(leftY, rightY) + 10;
    doc.setFont(undefined, "bold");
    doc.text("Seller Information", leftX, y);
    doc.text("Buyer Information", rightX, y);
    doc.setFont(undefined, "normal");

    y += 5;
    leftY = y;
    rightY = y;
    leftY += wrapText(`Name: ${seller?.businessName || ''}`, leftX, leftY, 90);
    leftY += wrapText(`NTN: ${seller?.ntn || ''}`, leftX, leftY, 90);
    leftY += wrapText(`Address: ${seller?.address || ''}, ${seller?.province || ''}`, leftX, leftY, 90);

    rightY += wrapText(`Name: ${buyer?.businessName || ''}`, rightX, rightY, 80);
    rightY += wrapText(`NTN: ${buyer?.ntn || ''}`, rightX, rightY, 80);
    rightY += wrapText(`Address: ${buyer?.address || ''}, ${buyer?.province || ''}`, rightX, rightY, 80);

    // Invoice Details Title
    y = Math.max(leftY, rightY) + 10;
    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    doc.text("Invoice Details", layoutConfig.pageWidth / 2, y, { align: "center" });

    // Items Table
    y += 6;
    const headers = ["Sr. No.", "HS Code", "Description", "Qty", "Rate", "Amount", "Tax %", "Tax Amt", "Total"];
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.setFillColor(...layoutConfig.headerBgColor);

    // Calculate table width and left position for border
    const tableX = x;
    const tableWidth = layoutConfig.colWidths.reduce((a, b) => a + b, 0);

    // Store row positions for border
    let tableStartY = y;
    let tableEndY = y;

    // Draw header row
    let headerX = tableX;
    headers.forEach((header, i) => {
      doc.setFillColor(...layoutConfig.headerBgColor);
      doc.rect(headerX, y, layoutConfig.colWidths[i], layoutConfig.rowHeight, "F");
      doc.setLineWidth(0.15); // thinner border
      doc.rect(headerX, y, layoutConfig.colWidths[i], layoutConfig.rowHeight);
      doc.setTextColor(0, 0, 0);
      const headerLines = doc.splitTextToSize(header, layoutConfig.colWidths[i] - 2);
      let headerY = y + 4;
      headerLines.forEach((line, idx) => {
      doc.text(line, headerX + 1, headerY + idx * 4, { maxWidth: layoutConfig.colWidths[i] - 2 });
      });
      headerX += layoutConfig.colWidths[i];
    });
    doc.setTextColor(0, 0, 0);

    y += layoutConfig.rowHeight;
    doc.setFont(undefined, "normal");

    // --- Summary Section at Bottom Right ---
    const summaryBoxWidth = 80; // Width of summary box in mm
    const summaryBoxHeight = 22; // Height for 3 summary rows
    // Place summary box at the right edge, no gap, and 5mm below the last item row
    const summaryX = layoutConfig.pageWidth - layoutConfig.margin.right - summaryBoxWidth+3;
    y = y + 2; // Add 5mm space from the last item row before summary box
    const summaryYBox = layoutConfig.pageHeight - layoutConfig.margin.bottom - summaryBoxHeight;

    // Calculate summary values (avoid NaN)
    const gross = itemsList.reduce((sum, i) => sum + Number(i.valueSalesExcludingST ?? (i.quantity * i.unitPrice) ?? 0), 0);
    const tax = itemsList.reduce((sum, i) => {
      const taxRateVal = typeof i.taxRate === "number" ? i.taxRate : parseFloat(i.rate) || 0;
      const salesTax = Number(i.salesTaxApplicable ?? (i.quantity * i.unitPrice * taxRateVal / 100) ?? 0);
      const extraTax = Number(i.extraTax ?? 0);
      const furtherTax = Number(i.furtherTax ?? 0);
      return sum + salesTax + extraTax + furtherTax;
    }, 0);
    const totalDiscount = itemsList.reduce((sum, i) => sum + Number(i.discount ?? 0), 0);
    const total = gross + tax - totalDiscount;

    // Draw item rows and keep track of last Y
    let rowYs = [];
    let lastRowIdx = itemsList.length - 1;
    itemsList.forEach((item, idx) => {
      // Show all rows, including the last one
      const amount = Number(item.valueSalesExcludingST ?? (item.quantity * item.unitPrice) ?? 0);
      const taxRateVal = typeof item.taxRate === "number" ? item.taxRate : parseFloat(item.rate) || 0;
      const salesTaxAmt = Number(item.salesTaxApplicable ?? (item.quantity * item.unitPrice * taxRateVal / 100) ?? 0);
      const extraTax = Number(item.extraTax ?? 0);
      const furtherTax = Number(item.furtherTax ?? 0);
      const discount = Number(item.discount ?? 0);
      const taxAmt = salesTaxAmt + extraTax + furtherTax;
      const total = amount + taxAmt - discount;

      const row = [
      (idx + 1).toString(),
      item.hsCode || item.hsCode,
      item.productDescription || item.description,
      String(item.quantity),
      `${(item.unitPrice || parseFloat(item.rate) || 0).toFixed(2)}`,
      `${amount.toFixed(2)}`,
      `${taxRateVal.toFixed(2)}%`,
      `${taxAmt.toFixed(2)}`,
      `${total.toFixed(2)}`
      ];

      let cellX = tableX;
      let maxCellHeight = layoutConfig.rowHeight;

      // Calculate max height for this row
      const cellHeights = row.map((cell, i) => {
      const lines = doc.splitTextToSize(cell, layoutConfig.colWidths[i] - 2);
      return lines.length * 4 + 2;
      });
      maxCellHeight = Math.max(...cellHeights, layoutConfig.rowHeight);

      // Page break if needed
      if (y + maxCellHeight > layoutConfig.pageHeight - layoutConfig.margin.bottom - 30) {
      // Draw border for previous table
      doc.setLineWidth(0.2); // thinner border
      doc.rect(tableX, tableStartY, tableWidth, y - tableStartY);
      doc.addPage();
      y = layoutConfig.margin.top;
      tableStartY = y;
      // Redraw header on new page
      let headerX2 = tableX;
      headers.forEach((header, i) => {
        doc.setFillColor(...layoutConfig.headerBgColor);
        doc.rect(headerX2, y, layoutConfig.colWidths[i], layoutConfig.rowHeight, "F");
        doc.setLineWidth(0.15);
        doc.rect(headerX2, y, layoutConfig.colWidths[i], layoutConfig.rowHeight);
        doc.setTextColor(0, 0, 0);
        const headerLines = doc.splitTextToSize(header, layoutConfig.colWidths[i] - 2);
        let headerY = y + 4;
        headerLines.forEach((line) => {
        doc.text(line, headerX2 + 1, headerY, { maxWidth: layoutConfig.colWidths[i] - 2 });
        headerY += 4;
        });
        headerX2 += layoutConfig.colWidths[i];
      });
      doc.setTextColor(0, 0, 0);
      y += layoutConfig.rowHeight;
      }

      // Draw cells with wrapped text and thin border
      row.forEach((cell, i) => {
      doc.setLineWidth(0.15); // thinner border
      doc.rect(cellX, y, layoutConfig.colWidths[i], maxCellHeight);
      const lines = doc.splitTextToSize(cell, layoutConfig.colWidths[i] - 2);
      let textY = y + 5;
      lines.forEach((line) => {
        if (textY + 2 <= y + maxCellHeight) {
        doc.text(line, cellX + 1, textY, { maxWidth: layoutConfig.colWidths[i] - 2 });
        textY += 4;
        }
      });
      cellX += layoutConfig.colWidths[i];
      });

      rowYs.push({ y, height: maxCellHeight });
      y += maxCellHeight;
    });

    // Add a gap between the table and the summary box
    y += 6;

    tableEndY = y -5;

    // Draw border from Sr. to top of summary (thinner border)
    doc.setLineWidth(0.3);
    doc.rect(tableX, tableStartY, tableWidth, summaryYBox - tableStartY);

    // Draw summary box border (thinner border)
    doc.setLineWidth(0.3);
    doc.rect(summaryX, summaryYBox, summaryBoxWidth, summaryBoxHeight);

    // Draw horizontal lines for each summary row
    const rowH = summaryBoxHeight / 3;
    for (let i = 1; i < 3; i++) {
      doc.line(summaryX, summaryYBox + i * rowH, summaryX + summaryBoxWidth, summaryYBox + i * rowH);
    }
    // Draw vertical line between label and value
    const labelWidth = 32;
    doc.line(summaryX + labelWidth, summaryYBox, summaryX + labelWidth, summaryYBox + summaryBoxHeight);

    // Place summary labels and values
    doc.setFont(undefined, "bold");
    doc.text("Gross Amount:", summaryX + 2, summaryYBox + rowH / 2 + 1.5);
    doc.text("Sales Tax:", summaryX + 2, summaryYBox + rowH + rowH / 2 + 1.5);
    doc.text("Total Amount:", summaryX + 2, summaryYBox + 2 * rowH + rowH / 2 + 1.5);

    doc.setFont(undefined, "normal");
    doc.text(`${gross.toFixed(2)}`, summaryX + labelWidth + 2, summaryYBox + rowH / 2 + 1.5);
    doc.text(`${tax.toFixed(2)}`, summaryX + labelWidth + 2, summaryYBox + rowH + rowH / 2 + 1.5);
    doc.text(`${total.toFixed(2)}`, summaryX + labelWidth + 2, summaryYBox + 2 * rowH + rowH / 2 + 1.5);

    // Centered footer text
    doc.setFont(undefined, "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "This is a system generated Invoice, signature not required.",
      layoutConfig.pageWidth / 2,
      layoutConfig.pageHeight - layoutConfig.margin.bottom +5 ,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    return y;
  }
  // For preview, generate HTML with same layout
  if (isPreview) {
    const invoicePreview = DOMElements.invoicePreview;
    if (!invoicePreview) {
      showToast("error", "Preview Error", "Invoice preview container not found");
      return;
    }

    invoicePreview.dataset.isDummy = isDummy;
    const qrCanvas = document.createElement("canvas");
    const qrText = (!invoiceNumber || invoiceNumber ==="N/A") ? invoiceRef : invoiceNumber ;
    await QRCode.toCanvas(qrCanvas, qrText, { width: 100, errorCorrectionLevel: "H" });
    const qrUrl = qrCanvas.toDataURL("image/png");

    // Get sales type for title
    const invoiceType = response?.invoiceType || response?.invoicePayload?.invoiceType || DOMElements.invoiceType?.value || 'Sale Invoice';
    const salesType = invoiceType.replace(' Invoice', '');

    const headers = ["Sr. No.", "HS Code", "Description", "Qty", "Rate", "Amount", "Tax %", "Tax Amt", "Total"];
    // Inside generateInvoicePDF, replace the summary calculation in the preview section
    const gross = itemsList.reduce((sum, i) => {
      const amount = Number(i.valueSalesExcludingST || (i.quantity * (i.unitPrice || 0)) || 0);
      return sum + amount;
    }, 0);


    const tax = itemsList.reduce((sum, i) => {
      const taxRateVal = Number(i.taxRate || parseFloat(i.rate) || 0);
      const amount = Number(i.valueSalesExcludingST || (i.quantity * (i.unitPrice || 0)) || 0);
      const salesTax = Number(i.salesTaxApplicable || (amount * taxRateVal / 100) || 0);
      const extraTax = Number(i.extraTax || 0);
      const furtherTax = Number(i.furtherTax || 0);
      return sum + salesTax + extraTax + furtherTax;
    }, 0);
    const totalDiscount = itemsList.reduce((sum, i) => sum + Number(i.discount || 0), 0);
    const total = gross + tax - totalDiscount;

    invoicePreview.innerHTML = `
      <style>
      #previewModal .invoice-preview { font-family: Arial, sans-serif; margin: 10mm; }
      #previewModal .header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
      #previewModal .info-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
      #previewModal .info-left, #previewModal .info-right { width: 45%; }
      #previewModal .summary { margin-top: 20px; text-align: right; margin-right: 20px; }
      #previewModal img.logo { width: 120px; }
      #previewModal img.qr { width: 100px; float: right; }
      #previewModal table { 
        width: 100%; 
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      #previewModal thead th { 
        border: 1px solid #000;
        background-color: rgb(${layoutConfig.headerBgColor.join(',')});
        padding: 8px;
        text-align: left;
        font-weight: bold;
      }
      #previewModal tbody td { 
        border: 1px solid #000; 
        padding: 8px;
        vertical-align: top;
      }
      #previewModal td.description { 
        max-width: ${layoutConfig.colWidths[2]}mm; 
        word-wrap: break-word;
      }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <img src="FBRDigitalInvoiceLogo.png" class="logo" alt="FBR Logo">
      <img src="${qrUrl}" class="qr" alt="QR Code">
      </div>
      <div class="header">${salesType} Invoice</div>
      <div class="info-container">
      <div class="info-left">
        <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
        <p><strong>Payment Mode:</strong> ${response?.paymentMode || document.getElementById('paymentMode')?.value || 'Cash'}</p>
        <p><strong>Currency:</strong> ${currency} (All amounts in ${currency})</p>
      </div>
      <div class="info-right">
        <p><strong>Invoice Ref No:</strong> ${invoiceRef}</p>
        <p><strong>FBR Invoice Number:</strong> ${invoiceNumber}</p>
      </div>
      </div>
      <div class="info-container">
      <div class="info-left">
        <p><strong>Seller Information</strong></p>
        <p><strong>Name:</strong> ${seller?.businessName || ''}</p>
        <p><strong>NTN:</strong> ${seller?.ntn || ''}</p>
        <p><strong>Address:</strong> ${seller?.address || ''}, ${seller?.province || ''}</p>
      </div>
      <div class="info-right">
        <p><strong>Buyer Information</strong></p>
        <p><strong>Name:</strong> ${buyer?.businessName || ''}</p>
        <p><strong>NTN:</strong> ${buyer?.ntn || ''}</p>
        <p><strong>Address:</strong> ${buyer?.address || ''}, ${buyer?.province || ''}</p>
      </div>
      </div>
      <p style="text-align: center; font-weight: bold; margin: 10px 0;">Invoice Details</p>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${itemsList.map((item, idx) => {
            const amount = Number(item.valueSalesExcludingST || (item.quantity * (item.unitPrice || 0)) || 0);
            const taxRateVal = Number(item.taxRate || parseFloat(item.rate) || 0);
            const salesTaxAmt = Number(item.salesTaxApplicable || (amount * taxRateVal / 100) || 0);
            const extraTax = Number(item.extraTax || 0);
            const furtherTax = Number(item.furtherTax || 0);
            const discount = Number(item.discount || 0);
            const taxAmt = salesTaxAmt + extraTax + furtherTax;
            const total = amount + taxAmt - discount;
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.hsCode || ''}</td>
                <td class="description">${item.productDescription || item.description || ''}</td>
                <td>${item.quantity}</td>
                <td>${(item.unitPrice || parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td>${amount.toFixed(2)}</td>
                <td>${taxRateVal.toFixed(2)}%</td>
                <td>${taxAmt.toFixed(2)}</td>
                <td>${total.toFixed(2)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div class="summary">
      <p><strong>Gross Amount:</strong> ${gross?.toFixed(2)}</p>
      <p><strong>Sales Tax:</strong> ${tax?.toFixed(2)}</p>
      <p><strong>Total Amount:</strong> ${total?.toFixed(2)}</p>
      </div>
    `;

    const previewModal = DOMElements.previewModal;
    previewModal.classList.add("active");
  } else {
    // Generate PDF
    await generateContent();
    const filename = `${invoiceDate}_Invoice_${invoiceNumber}.pdf`;
    doc.save(filename);
    showToast("success", "PDF Downloaded", `${isDummy ? "Dummy" : "Real"} Invoice PDF has been downloaded`);
  }
}

async function getDummyInvoiceResponse() {
  const seller = await getSelectedSeller()
  const buyer = await getSelectedBuyer()
  const invoiceDate = DOMElements.invoiceDate.value
  const invoiceRef = DOMElements.invoiceRef.value
  const currency = DOMElements.currency.value

  const dummyItems = items.map((item, index) => {
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unitPrice) || 0
    const taxRate = parseFloat(item.taxRate) || 0
    const amount = quantity * unitPrice
    const taxAmt = amount * (taxRate / 100)
    const total = amount + taxAmt
    return {
      itemSNo: (index + 1).toString(),
      hsCode: item.hsCode || '',
      productDescription: item.description || '',
      rate: `${taxRate.toFixed(2)}%`,
      uoM: item.uom || "",
      quantity: quantity,
      unitPrice: unitPrice,
      taxRate: taxRate,
      valueSalesExcludingST: amount,
      salesTaxApplicable: taxAmt,
      salesTaxWithheldAtSource: 0,
      extraTax: item.extraTax || 0,
      furtherTax: item.furtherTax || 0,
      totalValues: amount + taxAmt + (item.extraTax || 0) + (item.furtherTax || 0) - (item.discount || 0),
      fedPayable: item.fedPayable || 0,
      salesTaxWithheldAtSource: item.salesTaxWithheldAtSource || 0,
      sroScheduleNo: "",
      fedPayable: 0,
      discount: 0,
      saleType: item.saleType || "Services",
      sroItemSerialNo: "",
      fixedNotifiedValueOrRetailPrice: 0,
    }
  })

  return {
    invoiceNumber: "FBR-INV-2024-00001",
    dated: invoiceDate,
    status: "Submitted",
    invoiceRefNo: invoiceRef,
    currency: currency,
    seller: {
      ntn: seller ? seller.ntn : "",
      businessName: seller ? seller.businessName : "",
      province: seller ? seller.province : "",
      address: seller ? seller.address : "",
    },
    buyer: {
      ntn: buyer ? buyer.ntn : "",
      businessName: buyer ? buyer.businessName : "",
      province: buyer ? buyer.province : "",
      address: buyer ? buyer.address : "",
    },
    items: dummyItems,
    grossAmount: dummyItems.reduce((sum, i) => sum + i.valueSalesExcludingST, 0),
    salesTax: dummyItems.reduce((sum, i) => sum + i.salesTaxApplicable, 0),
    totalAmount: dummyItems.reduce((sum, i) => sum + i.totalValues, 0),
  }
}

function initPreviewModal() {
  const previewModal = DOMElements.previewModal;
  const closePreviewModal = DOMElements.closePreviewModal;
  const closePreviewModalBtn = DOMElements.closePreviewModalBtn;
  const downloadPreviewBtn = DOMElements.downloadPreviewBtn;
  const printPreviewBtn = DOMElements.printPreviewBtn;
  const dummyPreviewBtn = DOMElements.createDummyInvoiceBtn;
  const successModal = DOMElements.successModal;
  const closeSuccessModal = DOMElements.closeSuccessModal;
  const closeSuccessModalBtn = DOMElements.closeSuccessModalBtn;
  const previewContent = document.getElementById('previewContent') || DOMElements.invoicePreview;
  
  // Get the existing JSON view button from the modal footer
  const viewJsonBtn = document.getElementById('viewJsonBtn');

  // Add Preview Invoice button to success modal
  const previewInvoiceBtn = document.createElement("button");
  previewInvoiceBtn.className = "btn btn-primary";
  previewInvoiceBtn.innerHTML = '<i class="fas fa-eye"></i> Preview Invoice';
  previewInvoiceBtn.id = "previewInvoiceBtn";
  const successModalFooter = document.querySelector("#successModal .modal-footer");
  if (successModalFooter) {
    // Try to find the left-buttons container first (new structure)
    const leftButtons = successModalFooter.querySelector(".left-buttons");
    if (leftButtons) {
      leftButtons.appendChild(previewInvoiceBtn);
    } else {
      // Fallback: try to insert before download button (old structure)
      const downloadBtn = successModalFooter.querySelector("#downloadInvoiceBtn");
      if (downloadBtn) {
        successModalFooter.insertBefore(previewInvoiceBtn, downloadBtn);
      } else {
        // Last resort: just append to footer
        successModalFooter.appendChild(previewInvoiceBtn);
      }
    }
  }

  // Get references to JSON modal elements
  const jsonModal = document.getElementById("jsonModal");
  const closeJsonModal = document.getElementById("closeJsonModal");
  const closeJsonModalBtn = document.getElementById("closeJsonModalBtn");
  // const copyJsonBtn = document.getElementById("copyJsonBtn");
  const jsonPayload = document.getElementById("jsonPayload");
  
  // Toggle JSON view in a separate modal
  const toggleJsonView = () => {
    // Get the invoice data
    const invoiceData = window.currentInvoiceData || lastSubmissionResponse || {};
    
    // Format and display JSON in the modal
    jsonPayload.textContent = JSON.stringify(invoiceData, null, 2);
    jsonModal.classList.add("active");
  };
  

  
  // Close JSON modal
  const closeJsonModalHandler = () => jsonModal.classList.remove("active");
  
  // Set up event listeners for JSON modal
  closeJsonModal?.addEventListener("click", closeJsonModalHandler);
  closeJsonModalBtn?.addEventListener("click", closeJsonModalHandler);
  
  // Event listeners with consolidated handlers
  let isJsonView = false;
  const handlePreview = (isDummy) => {
    const response = isDummy ? getDummyInvoiceResponse() : lastSubmissionResponse;
    // Store the current invoice data for JSON view
    window.currentInvoiceData = response;
    generateInvoicePDF(response, isDummy, true);
    // Reset view to HTML when opening a new preview
    isJsonView = false;
    viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';
  };

  const closeModal = (modal) => {
    modal.classList.remove("active");
    // Reset view to HTML when closing
    isJsonView = false;
    if (viewJsonBtn) {
      viewJsonBtn.innerHTML = '<i class="fas fa-code"></i> View JSON';
    }
  };

  // Add event listeners
  if (dummyPreviewBtn) dummyPreviewBtn.addEventListener("click", () => handlePreview(true));
  if (previewInvoiceBtn) previewInvoiceBtn.addEventListener("click", () => handlePreview(false));
  if (viewJsonBtn) viewJsonBtn.addEventListener("click", toggleJsonView);
  
  [closePreviewModal, closePreviewModalBtn].filter(Boolean).forEach(btn => 
    btn.addEventListener("click", () => closeModal(previewModal))
  );
  
  [closeSuccessModal, closeSuccessModalBtn].filter(Boolean).forEach(btn => 
    btn.addEventListener("click", () => closeModal(successModal))
  );

  // Close modal when clicking outside content
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      closeModal(previewModal);
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal.classList.contains('active')) {
      closeModal(previewModal);
    }
  });

  // Download PDF handler
  if (downloadPreviewBtn) {
    downloadPreviewBtn.addEventListener("click", () => {
      const isDummy = DOMElements.invoicePreview?.dataset.isDummy === "true";
      const invoiceData = window.currentInvoiceData || lastSubmissionResponse;
      if (invoiceData) {
        generateInvoicePDF(invoiceData, isDummy, false);
      }
    });
  }

  // Print invoice handler
  if (printPreviewBtn) {
    printPreviewBtn.addEventListener("click", () => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return showToast("error", "Print Error", "Unable to open print window.");

      const printStyles = `
        body { font-family: Arial, sans-serif; margin: 8mm; font-size: 10px; }
        .header { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 6px; }
        .info-container { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-left, .info-right { width: 48%; }
        .summary { margin-top: 10px; text-align: right; margin-right: 10px; font-size: 10px; }
        img.logo { width: 80px; }
        img.qr { width: 70px; float: right; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th, td { border: 0.5px solid #000; padding: 2px 3px; text-align: left; vertical-align: top; }
        th { background-color: rgb(${layoutConfig.headerBgColor.join(',')}); font-size: 9.5px; }
        td.description { max-width: ${layoutConfig.colWidths[2]}mm; word-break: break-word; white-space: pre-wrap; }
      `;

      // If in JSON view, create a print-friendly version
      if (isJsonView) {
        const invoiceData = window.currentInvoiceData || lastSubmissionResponse || {};
        printWindow.document.write(`
          <html><head><title>Invoice JSON</title>
          <style>${printStyles}
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style></head>
          <body>
            <pre>${JSON.stringify(invoiceData, null, 2)}</pre>
          </body></html>
        `);
      } else {
        // Regular print for HTML view
        printWindow.document.write(`
          <html><head><title>Print Invoice</title><style>${printStyles}</style></head>
          <body>${previewContent.innerHTML}</body></html>
        `);
      }
      
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    });
  }
}

const deleteEntity = async (type, id, storeName, populateSelect, populateTable) => {
  if (confirm(`Are you sure you want to delete this ${type}?`)) {
    await dbDelete(storeName, id);
    await populateSelect();
    await populateTable();
    showToast("success", `${type} Deleted`, `${type} has been removed successfully`);
  }
};

window.deleteSeller = (sellerId) => deleteEntity(
  "seller", sellerId, STORE_NAMES.sellers, populateSellerSelect, populateSellersTable
);

window.deleteBuyer = (buyerNtn) => deleteEntity(
  "buyer", buyerNtn, STORE_NAMES.buyers, populateBuyerSelect, populateBuyersTable
);

window.editSeller = async (sellerId) => {
  const seller = await dbGet(STORE_NAMES.sellers, sellerId);
  if (!seller) return;
  
  currentEditingSeller = seller;
  
  // Populate form fields
  const fields = {
    sellerNTN: seller.ntn,
    sellerBusinessName: seller.businessName,
    sellerBusinessActivity: seller.businessActivity || "",
    sellerSector: seller.sector || "",
    sellerProvince: seller.province,
    sellerAddress: seller.address,
    sellerSandboxToken: seller.sandboxToken,
    sellerProductionToken: seller.productionToken,
    sellerRegStatus: seller.registrationStatus,
    sellerRegType: seller.registrationType,
    sellerLastSaleInvoiceId: seller.lastSaleInvoiceId || 1,
    sellerLastDebitNoteId: seller.lastDebitNoteId || 1
  };
  
  Object.entries(fields).forEach(([key, value]) => {
    if (DOMElements[key]) DOMElements[key].value = value;
  });
  
  populateSectorOptions(seller.businessActivity || "");
  populateScenarioOptions(seller.businessActivity || "", seller.sector || "");
  
  // Populate scenario chips
  const scenarioIds = Array.isArray(seller.scenarioIds) 
    ? seller.scenarioIds 
    : (seller.scenarioIds || "").split(",");
    
  DOMElements.scenarioChips.innerHTML = "";
  scenarioIds.filter(id => id.trim()).forEach(scenarioId => {
    const trimmedId = scenarioId.trim();
    const scenarioDesc = scenarioDescriptions.find(s => s.scenarioId === trimmedId);
    const chip = document.createElement("div");
    chip.className = "scenario-chip";
    chip.innerHTML = `
      ${trimmedId} - ${scenarioDesc ? scenarioDesc.description.substring(0, 30) + "..." : "Unknown"}
      <button type="button" class="remove-chip" onclick="removeScenarioChip('${trimmedId}')">&times;</button>
    `;
    DOMElements.scenarioChips.appendChild(chip);
  });
  
  DOMElements.sellerScenarioIds.value = scenarioIds.join(",");
  DOMElements.sellerModalTitle.textContent = "Edit Seller";
  DOMElements.sellerModal.classList.add("active");
}

window.editBuyer = async (buyerId) => {
  const buyer = await dbGet(STORE_NAMES.buyers, buyerId);
  if (!buyer) return;
  
  currentEditingBuyer = buyer;
  
  const fields = {
    buyerNTN: buyer.ntn,
    buyerBusinessName: buyer.businessName,
    buyerProvince: buyer.province,
    buyerAddress: buyer.address,
    buyerRegType: buyer.registrationType,
    buyerStatus: buyer.registrationStatus
  };
  
  Object.entries(fields).forEach(([key, value]) => {
    if (DOMElements[key]) DOMElements[key].value = value;
  });
  
  DOMElements.buyerModalTitle.textContent = "Edit Buyer";
  DOMElements.buyerModal.classList.add("active");
}

// Form actions
function initFormActions() {

  if (DOMElements.addItemBtn) {
    DOMElements.addItemBtn.addEventListener("click", addNewItem)
  }

  // Add Product to Invoice button
  const addProductToInvoiceBtn = document.getElementById('addProductToInvoiceBtn')
  if (addProductToInvoiceBtn) {
    addProductToInvoiceBtn.addEventListener('click', async () => {
      const productModal = document.getElementById('productModal')
      const productForm = document.getElementById('productForm')
      const productModalTitle = document.getElementById('productModalTitle')
      const addToInvoiceBtn = document.getElementById('addToInvoiceBtn')
      
      if (productModal && productForm && productModalTitle) {
        currentEditingProduct = null
        productForm.reset()
        productModalTitle.textContent = 'Add Product to Invoice'
        addToInvoiceBtn.style.display = 'inline-block'
        showProductModalLoader(true)
        productModal.classList.add('active')
        await populateProductModalOptions()
        showProductModalLoader(false)
      }
    })
  }

  // Add Test Draft Invoice button handler
  if (DOMElements.addInvoiceBtn) {
    DOMElements.addInvoiceBtn.addEventListener("click", async () => {
      try {
        const seller = await getSelectedSeller();
        const buyer = await getSelectedBuyer();
        
        if (!seller || !buyer) {
          showToast("error", "Missing Data", "Please select both seller and buyer.");
          return;
        }
        
        let invoice = {
          id: currentEditingInvoice ? currentEditingInvoice.id : Date.now().toString(),
          status: "draft",
          invoiceDate: DOMElements.invoiceDate.value,
          invoiceType: DOMElements.invoiceType.value,
          scenarioId: DOMElements.scenarioId.value,
          currency: DOMElements.currency.value,
          invoiceRefNo: DOMElements.invoiceRef.value,
          sellerNTNCNIC: seller.ntn,
          sellerBusinessName: seller.businessName,
          buyerNTNCNIC: buyer.ntn,
          buyerBusinessName: buyer.businessName,
          items: items,
          totalAmount: calculateTotalFromLineItems(items),
          createdAt: currentEditingInvoice ? currentEditingInvoice.createdAt : new Date().toISOString(),
          dated: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          invoicePayload: {
            invoiceType: DOMElements.invoiceType.value,
            invoiceDate: DOMElements.invoiceDate.value,
            sellerNTNCNIC: seller.ntn,
            buyerNTNCNIC: buyer.ntn,
            invoiceRefNo: DOMElements.invoiceRef.value,
            currency: DOMElements.currency.value,
            items: items
          }
        };
        
        await dbSet(STORE_NAMES.invoices, invoice);
        
        if (currentEditingInvoice) {
          showToast("success", "Draft Updated", "Draft invoice updated successfully.");
          currentEditingInvoice = null;
          originalInvoiceState = null;
          updateEditStateUI(false);
        } else {
          showToast("success", "Draft Saved", "Invoice saved as draft successfully.");
        }
        
        await populateInvoicesTable();
        // Generate new reference number after saving draft
        await resetInvoiceReference();
      } catch (e) {
        showToast("error", "Failed to Add Test Invoice", e.message || e);
      }
    });
  }

  // Add event listener for Submit Invoice button
  if (DOMElements.submitInvoiceBtn) {
    DOMElements.submitInvoiceBtn.addEventListener("click", async () => {
      try {
        await submitInvoiceToFBR();
      } catch (e) {
        showToast("error", "Submission Failed", e.message || e);
      }
    });
  }

// Call this function after FBR submission to save the submitted invoice
// async function saveSubmittedInvoiceToDB(invoiceResponse) {
//   try {
//     // Add status and meta fields
//     invoiceResponse.status = "submitted";
//     invoiceResponse.savedAt = new Date().toISOString();
//     await dbSet(STORE_NAMES.invoices, invoiceResponse);
//     await populateInvoicesTable();
//     showToast("success", "Submitted Invoice Saved", "Submitted invoice was saved successfully.");
//   } catch (e) {
//     showToast("error", "Failed to Save Submitted Invoice", e.message || e);
//   }
// }


  // Invoice type change handler
  DOMElements.invoiceType.addEventListener("change", resetInvoiceReference)

  DOMElements.resetBtn.addEventListener("click", async () => {
    if (currentEditingInvoice && originalInvoiceState) {
      if (confirm("Are you sure you want to reset to original state? All changes will be lost.")) {
        await loadInvoiceIntoForm(originalInvoiceState)
        showToast("info", "Form Reset", "Invoice form has been reset to original state")
      }
    } else {
      if (confirm("Are you sure you want to reset the form? All entered data will be lost.")) {
        await resetToInitialState()
        showToast("info", "Form Reset", "Invoice form has been reset")
      }
    }
  })

  // Submit button with new modal integration
  DOMElements.submitBtn.addEventListener("click", async () => {
    // Validation
    if (DOMElements.sellerSelect.value === "") {
      showToast("error", "Validation Error", "Please select a seller")
      return
    }
    if (DOMElements.buyerSelect.value === "") {
      showToast("error", "Validation Error", "Please select a buyer")
      return
    }

    if ( !DOMElements.modeToggle.checked &&  DOMElements.scenarioId.value === "") {
      showToast("error", "Validation Error", "Please select a scenario")
      return
    }

    if (DOMElements.invoiceDate.value === "") {
      showToast("error", "Validation Error", "Please select an invoice date")
      return
    }
    if (DOMElements.currency.value === "") {
      showToast("error", "Validation Error", "Please select a currency")
      return
    }
    if (DOMElements.invoiceRef.value === "") {
      showToast("error", "Validation Error", "Please enter an invoice reference number")
      return
    }
    if (items.length === 0) {
      showToast("error", "Validation Error", "Please add at least one item to the invoice")
      return
    }

    const submitBtn = DOMElements.submitBtn
    const originalContent = submitBtn.innerHTML
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'
    submitBtn.disabled = true

    try {

      const seller = await getSelectedSeller()
      const buyer = await getSelectedBuyer()

      const invoicePayload = {
        invoiceType: DOMElements.invoiceType.value,
        invoiceDate: DOMElements.invoiceDate.value,
        sellerNTNCNIC: seller.ntn,
        sellerBusinessName: seller.businessName,
        sellerProvince: seller.province,
        sellerAddress: seller.address,
        buyerNTNCNIC: buyer.ntn,
        buyerBusinessName: buyer.businessName,
        buyerRegistrationType: buyer.registrationType,
        buyerProvince: buyer.province,
        buyerAddress: buyer.address,
        invoiceRefNo: DOMElements.invoiceRef.value,
        currency: DOMElements.currency.value,
        items: items.map((item, index) => {
          const value = item.quantity * item.unitPrice
          const salesTaxApplicable = (value * item.taxRate) / 100
          const totalValues = value + salesTaxApplicable

          const sroSchedule = item.sroScheduleOptions
            ? item.sroScheduleOptions.find((s) => s.srO_ID == item.sroSchedule)
            : null
          const sroScheduleNo = sroSchedule ? sroSchedule.srO_DESC : ""

          const sroItemData = item.sroItemOptions
            ? item.sroItemOptions.find((si) => si.srO_ITEM_ID == item.sroItem)
            : null
          const sroItemSerialNo = sroItemData ? sroItemData.srO_ITEM_DESC : (index + 1).toString()

          return {
            itemSNo: (index + 1).toString(),
            hsCode: item.hsCode,
            productDescription: item.description,
            rate: `${item?.taxRate?.toFixed(2)}%`,
            uoM: item.uom || "",
            quantity: item.quantity,
            valueSalesExcludingST: value,
            salesTaxApplicable: salesTaxApplicable,
            salesTaxWithheldAtSource: 0,
            extraTax: item.extraTax || 0,
            furtherTax: item.furtherTax || 0,
            totalValues: value + salesTaxApplicable + (item.extraTax || 0) + (item.furtherTax || 0) - (item.discount || 0),
            sroScheduleNo: sroScheduleNo,
            fedPayable: item.fedPayable || 0,
            discount: item.discount || 0,
            salesTaxWithheldAtSource: item.salesTaxWithheldAtSource || 0,
            saleType: item.saleType || "Services",
            sroItemSerialNo: sroItemSerialNo,
            fixedNotifiedValueOrRetailPrice: 0,
          }
        }),
      }

      if (!DOMElements.modeToggle.checked) {
        invoicePayload.scenarioId = DOMElements.scenarioId.value
      }

    // Determine environment from toggle
  const isProduction = DOMElements.modeToggle.checked;

// Select correct API URLs
const validateURL = isProduction ? API_URLS.validate.production : API_URLS.validate.sandbox;
const submitURL = isProduction ? API_URLS.submit.production : API_URLS.submit.sandbox;


      // Step 1: Validate
      showToast("info", "Processing", "📋 Validating invoice data...")

      const validateResponse = await fetchWithAuth(validateURL, {
        method: "POST",
        body: JSON.stringify(invoicePayload),
      })

      const statusCode = validateResponse.validationResponse?.statusCode
      const vr = validateResponse.validationResponse

      if (statusCode === "00") {
        // Step 2: Submit
        showToast("info", "Processing", "📤 Submitting invoice to FBR system...")
        const postResponse = await fetchWithAuth(submitURL, {
          method: "POST",
          body: JSON.stringify(invoicePayload),
        })

        // Combine validation and submission responses
        const submissionResponse = {
          ...postResponse,
          validationResponse: vr
        };
        
        // Alias postResponse to postResult for backward compatibility
        const postResult = postResponse;

        // Create or update the invoice with submission details
        let invoiceId = currentEditingInvoice;
        let invoice;
        
        if (invoiceId) {
          // Update existing invoice
          invoice = await dbGet(STORE_NAMES.invoices, invoiceId);
        } else {
          // Create new invoice with new ID
          invoiceId = Date.now().toString();
          invoice = {
            id: invoiceId,
            createdAt: new Date().toISOString(),
            invoicePayload: invoicePayload
          };
        }
        
        // Calculate total amount from line items using the new function
        const totalAmount = calculateTotalFromLineItems(invoicePayload.items);

        const updatedInvoice = {
          ...invoice,
          status: 'submitted',
          invoiceNumber: postResponse.invoiceNumber || '',
          dated: postResponse.dated || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalAmount: totalAmount,
          validationResponse: vr,
          submissionResponse: submissionResponse,
          invoicePayload: invoicePayload // Ensure we have the latest payload
        };

        // Save the updated invoice
        await dbSet(STORE_NAMES.invoices, updatedInvoice);
        currentEditingInvoice = invoiceId; // Ensure this is set for the UI

        // Update UI
        DOMElements.fbrInvoiceNumber.textContent = postResponse.invoiceNumber || "Pending";
        DOMElements.successResponseJson.textContent = JSON.stringify(submissionResponse, null, 2);
        
        // Auto-select the table view tab in success modal
        const tableViewTab = document.querySelector('#successModal [data-tab="table"]');
        if (tableViewTab) {
          tableViewTab.click();
        }

        // ✅ Table Tab (now richer HTML rendered inside a div container)
        const respContainer = DOMElements.successResponseData;

        // helper to format date-time nicely
        const formatDateTime = (dt) => {
          try {
            return new Date(dt).toLocaleString();
          } catch (e) {
            return dt || "-";
          }
        };

        let html = `<div style="margin-top: 20px;">
            <h3 style="color: #28a745; margin-bottom: 10px; font-size: 1rem;">✅ Submission Results</h3>
            <table class="response-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${postResponse.invoiceNumber || 'Pending'}</strong></td>
                  <td>${postResponse.dated ? formatDateTime(postResponse.dated) : 'Processing'}</td>
                  <td><span class="status-indicator status-success">Submitted</span></td>
                </tr>
              </tbody>
            </table>
          </div>`;

        // If item level statuses are available, append another table
        if (postResponse.validationResponse?.invoiceStatuses?.length > 0) {
          html += `<div style="margin-top: 15px;">
              <h4 style="color: #0052A5; font-size: 0.9rem;">📦 Item Processing Status</h4>
              <table class="response-table">
                <thead>
                  <tr>
                    <th>Item #</th>
                    <th>Status Code</th>
                    <th>Invoice Number</th>
                    <th>Status</th>
                    <th>Error Code</th>
                    <th>Error</th>
                  </tr>
                </thead>
              <tbody>`;
          postResponse.validationResponse.invoiceStatuses.forEach((item, idx) => {
            html += `
                  <tr>
                    <td>${item.itemSNo}</td>
                    <td>${item.statusCode || '-'}</td>
                    <td>${item.invoiceNo || '-'}</td>
                    <td>${item.status || '-'}</td>
                    <td>${item.errorCode || '-'}</td>
                    <td>${item.error || '-'}</td>
                  </tr>`;
          });
          html += `
                </tbody>
              </table>
            </div>`;
        }

        respContainer.innerHTML = html;

        // ✅ Show Modal
        // DOMElements.successModal.style.display = "block"
        DOMElements.successModal.classList.add("active")

        // Store response for PDF generation
        lastSubmissionResponse = postResult

        // Update seller's invoice ID
        updateInvoiceReference()

        showToast(
          "success",
          "Invoice Submitted",
          `Invoice submitted successfully! FBR Invoice ID: ${postResult.invoiceNumber}`,
        )
        // Update the invoices table to show the new invoice
        await populateInvoicesTable();
        

        
        // Form will be reset when success modal is closed
        
      
      } else {
        // Show error with retry button
        const errorContainer = DOMElements.invoiceResult
        const errorContent = DOMElements.errorContent

        errorContent.innerHTML = `
          <p><strong>Error:</strong> ${vr?.error || "Unknown error"}</p>
          <p><strong>Code:</strong> ${vr?.errorCode || "-"}</p>
          <pre style="margin-top: 10px; font-size: 0.8rem;">${formatResponse(validateResponse)}</pre>
        `

        errorContainer.style.display = "block"
        
        // Display error modal with detailed information
        const errorMessage = vr?.error || "Validation failed";
        const errorDetails = {
          error: vr?.error || "Unknown error",
          errorCode: vr?.errorCode || "-",
          response: validateResponse
        };
        
        handleSubmissionError(new Error(errorMessage), errorDetails);
        return; // Don't throw, just return after handling
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      // Handle different types of errors
      const errorMessage = error.message || "An unexpected error occurred during submission";
      const errorDetails = {
        message: errorMessage,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      // Show toast for immediate feedback
      showToast("error", "Submission Failed", errorMessage);
      
      // Display detailed error modal
      handleSubmissionError(error, errorDetails);
      
    } finally {
      submitBtn.innerHTML = originalContent
      submitBtn.disabled = false
    }
  })
}

// API Testing functionality
function initAPITesting() {
  const endpointButtons = document.querySelectorAll(".endpoint-btn")
  const testApiBtn = DOMElements.testApiBtn
  const apiResult = DOMElements.apiResult
  const paramGroups = DOMElements.paramGroups
  const apiResultStatus = DOMElements.apiResultStatus
  const copyApiResponseBtn = DOMElements.copyApiResponseBtn

  const apiEndpoints = {
    provinces: API_URLS.provinces,
    doctypecode: "https://gw.fbr.gov.pk/pdi/v1/doctypecode",
    itemdesccode: API_URLS.hsCodes,
    sroitemcode: "https://gw.fbr.gov.pk/pdi/v1/sroitemcode",
    transtypecode: "https://gw.fbr.gov.pk/pdi/v1/transtypecode",
    uom: "https://gw.fbr.gov.pk/pdi/v1/uom",
    SroSchedule: "https://gw.fbr.gov.pk/pdi/v1/SroSchedule",
    SaleTypeToRate: API_URLS.saleTypeToRate,
    HS_UOM: "https://gw.fbr.gov.pk/pdi/v2/HS_UOM",
    SROItem: "https://gw.fbr.gov.pk/pdi/v2/SROItem",
    statl: "https://gw.fbr.gov.pk/dist/v1/statl",
    Get_Reg_Type: "https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type",
  }

  const endpointParams = {
    SroSchedule: ["rate_id", "date", "origination_supplier_csv"],
    SaleTypeToRate: ["date_iso", "transTypeId", "originationSupplier"],
    HS_UOM: ["hs_code", "annexure_id"],
    SROItem: ["date_iso", "sro_id"],
    statl: ["regno", "post_date"],
    Get_Reg_Type: ["Registration_No"],
  }

  function setActiveEndpoint(endpoint) {
    paramGroups.forEach((group) => group.classList.remove("visible"))

    const paramsToShow = endpointParams[endpoint] || []
    paramsToShow.forEach((param) => {
      const paramElement = document.getElementById(`param-${param}`)
      if (paramElement) {
        paramElement.classList.add("visible")
      }
    })
  }

  endpointButtons.forEach((button) => {
    button.addEventListener("click", function () {
      endpointButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      const endpoint = this.dataset.endpoint
      setActiveEndpoint(endpoint)
    })
  })

  copyApiResponseBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(apiResult.textContent)
      .then(() => showToast("success", "Copied", "API response copied to clipboard"))
      .catch((err) => showToast("error", "Copy Failed", "Failed to copy API response"))
  })

  testApiBtn.addEventListener("click", async () => {
    const activeEndpoint = document.querySelector(".endpoint-btn.active").dataset.endpoint
   
    testApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...'
    testApiBtn.disabled = true
    apiResult.textContent = "Testing endpoint, please wait..."
    apiResultStatus.className = "result-status loading"
    apiResultStatus.innerHTML = '<div class="loading-spinner"></div> Loading...'

    try {
      let url = apiEndpoints[activeEndpoint]
      let method = "GET"
      let body = null

      if (activeEndpoint === "SroSchedule") {
        const rate_id = document.getElementById("rate_id").value
        const date = document.getElementById("date").value
        const origination_supplier_csv = document.getElementById("origination_supplier_csv").value
        url += `?rate_id=${rate_id}&date=${date}&origination_supplier_csv=${origination_supplier_csv}`
      } else if (activeEndpoint === "SaleTypeToRate") {
        const date = formatDateForAPI(document.getElementById("date_iso").value,"DD-MMM-YYYY")
        const transTypeId = document.getElementById("transTypeId").value
        const originationSupplier = document.getElementById("originationSupplier").value
        url += `?date=${date}&transTypeId=${transTypeId}&originationSupplier=${originationSupplier}`
      } else if (activeEndpoint === "HS_UOM") {
        const hs_code = document.getElementById("hs_code").value
        const annexure_id = document.getElementById("annexure_id").value
        url += `?hs_code=${hs_code}&annexure_id=${annexure_id}`
      } else if (activeEndpoint === "SROItem") {
        const date = document.getElementById("date_iso").value
        const sro_id = document.getElementById("sro_id").value
        url += `?date=${date}&sro_id=${sro_id}`
      } else if (activeEndpoint === "statl") {
        method = "POST"
        const regno = document.getElementById("regno").value
        const post_date = document.getElementById("post_date").value
        body = JSON.stringify({ regno: regno, date: post_date })
      } else if (activeEndpoint === "Get_Reg_Type") {
        method = "POST"
        const Registration_No = document.getElementById("Registration_No").value
        body = JSON.stringify({ Registration_No: Registration_No })
      }

      const options = { method }
      if (body) {
        options.body = body
      }

      const response = await fetchWithAuth(url, options)

      apiResult.textContent = formatResponse(response)
      apiResultStatus.className = "result-status status-success"
      apiResultStatus.textContent = "Success"
      showToast("success", "API Test", "API endpoint tested successfully")
    } catch (error) {
      apiResult.textContent = `Error: ${error.message}`
      apiResultStatus.className = "result-status status-error"
      apiResultStatus.textContent = "Error"
      showToast("error", "API Test Failed", error.message)
    } finally {
      testApiBtn.innerHTML = '<i class="fas fa-bolt"></i> Test Endpoint'
      testApiBtn.disabled = false
    }
  })

  setActiveEndpoint("provinces")
}

// Get Token of selected seller
async function getToken() {
  const sellers = await dbGetAll(STORE_NAMES.sellers);
  const selectedSellerNTN = DOMElements.sellerSelect.value;
  const seller = sellers.find(s => s.ntn === selectedSellerNTN);
  return seller ? (seller.sandboxToken || seller.productionToken) : "";
}

// Update UI to show edit state
function updateEditStateUI(isEditing) {
  // Update header text
  const header = document.querySelector('.card-header h2');
  if (header && header.textContent.includes('Invoice Details') || header && header.textContent.includes('Editing Invoice')) {
    header.innerHTML = isEditing ? 
      '<i class="fas fa-edit"></i> Editing Invoice <span style="color:#ff9800; font-size:0.8em;">(ID: ' + (currentEditingInvoice?.id || '') + ')</span>' : 
      '<i class="fas fa-receipt"></i> New Invoice';
  }
  
  // Update submit button text
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = isEditing ? 
      '<i class="fas fa-save"></i> Update Invoice' : 
      '<i class="fas fa-paper-plane"></i> Create Invoice';
  }
  
  // Update draft button text
  const addInvoiceBtn = document.getElementById('addInvoiceBtn');
  if (addInvoiceBtn) {
    addInvoiceBtn.innerHTML = isEditing ? 
      '<i class="fas fa-save"></i> Update Draft' : 
      '<i class="fas fa-save"></i> Save as Draft';
  }
}

// Generate next invoice reference for drafts
async function getNextInvoiceRef(sellerId, invoiceType) {
  console.log('getNextInvoiceRef called with:', { sellerId, invoiceType });
  
  const invoices = await dbGetAll(STORE_NAMES.invoices);
  const sellers = await dbGetAll(STORE_NAMES.sellers);
  const seller = sellers.find(s => s.ntn === sellerId);
  
  console.log('Found seller:', seller);
  
  // if (!seller) return "";
  
  const prefix = invoiceType === "Sale Invoice" ? "SI" : "DN";
  const matchingInvoices = invoices.filter(inv => inv.sellerNTNCNIC === sellerId && inv.invoiceType === invoiceType);
  console.log('Matching invoices found in DB:', matchingInvoices.map(inv => ({ id: inv.id, ref: inv.invoiceRefNo || inv.invoiceRef })));
  
  const existingRefs = matchingInvoices
    .map(inv => inv.invoiceRefNo || inv.invoiceRef || "")
    .filter(ref => ref.startsWith(prefix))
    .map(ref => {
      const numPart = ref.split("-")[1];
      return numPart ? parseInt(numPart, 10) : 0;
    })
    .sort((a, b) => b - a);
  
  console.log('Existing refs from invoices:', existingRefs);
  
  const baseId = invoiceType === "Sale Invoice" ? 
    (typeof seller.lastSaleInvoiceId === 'string' ? parseInt(seller.lastSaleInvoiceId, 10) : seller.lastSaleInvoiceId) : 
    (typeof seller.lastDebitNoteId === 'string' ? parseInt(seller.lastDebitNoteId, 10) : seller.lastDebitNoteId);
    
  console.log('Seller stored ID:', baseId);
  
  const nextId = Math.max(existingRefs[0] || 0, baseId || 0) + 1;
  console.log('Calculated next ID:', nextId);
  const refNumber = `${prefix}-${nextId.toString().padStart(4, "0")}`;
  
  // Update seller's last invoice ID
  if (invoiceType === "Sale Invoice") {
    seller.lastSaleInvoiceId = nextId;
  } else {
    seller.lastDebitNoteId = nextId;
  }
  await dbPut(STORE_NAMES.sellers, seller);
  
  console.log('Generated next ref number:', refNumber);
  
  return refNumber;
}



// Delete invoice function
window.deleteInvoice = async (invoiceId) => {
  try {
   
    // Ensure we have a valid ID
    if (!invoiceId) {
      console.error("No invoice ID provided");
      showToast("error", "Error", "No invoice ID provided");
      return false;
    }
    
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this invoice?")) {
      console.log("Deletion cancelled by user");
      return false;
    }
    
    // Get the invoice to check its status
    console.log("Fetching invoice from database...");
    const invoice = await dbGet(STORE_NAMES.invoices, String(invoiceId));
    
    if (!invoice) {
      console.error("Invoice not found in database");
      showToast("error", "Error", "Invoice not found in database");
      return false;
    }
    
    console.log("Invoice found, status:", invoice.status || 'draft');
    
    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft' && invoice.status !== undefined) {
      console.log("Cannot delete non-draft invoice");
      showToast("error", "Cannot Delete", "Only draft invoices can be deleted");
      return false;
    }
    
    // Proceed with deletion
    console.log("Deleting invoice from database...");
    await dbDelete(STORE_NAMES.invoices, String(invoiceId));
    console.log("Invoice deleted, refreshing table...");
    await populateInvoicesTable();
    
    console.log("Showing success message");
    showToast("success", "Invoice Deleted", "Draft invoice has been removed successfully");
    return true;
    
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    showToast("error", "Error", `Failed to delete invoice: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Filter invoices by date range
function filterByDateRange(invoices, dateFilter, customStartDate, customEndDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getDateRange = () => {
    const start = new Date(today);
    const end = new Date(today);
    
    switch(dateFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 86399999) };
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'thisWeek':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() + (6 - end.getDay()));
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'lastWeek':
        start.setDate(start.getDate() - start.getDay() - 7);
        end.setDate(end.getDate() - end.getDay() - 1);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'thisMonth':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1, 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'thisYear':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'lastYear':
        start.setFullYear(start.getFullYear() - 1, 0, 1);
        end.setFullYear(end.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'custom':
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate)
        };
      default:
        return null;
    }
  };

  if (dateFilter === 'all') return invoices;

  const range = getDateRange();
  if (!range) return invoices;

  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoiceDate || invoice.dated || 0);
    return invoiceDate >= range.start && invoiceDate <= range.end;
  });
}

// Search through invoices
function searchInvoices(invoices, searchTerm) {
  if (!searchTerm) return invoices;
  
  searchTerm = searchTerm.toLowerCase();
  return invoices.filter(invoice => {
    return (
      (invoice?.id || '').toString().toLowerCase().includes(searchTerm) ||
      (invoice?.invoiceRefNo || invoice?.invoicePayload?.invoiceRefNo || '').toLowerCase().includes(searchTerm) ||
      (invoice?.invoiceType || invoice?.invoicePayload?.invoiceType || '').toLowerCase().includes(searchTerm) ||
      (invoice?.totalAmount || '').toString().includes(searchTerm) ||
      (invoice?.invoiceNumber || invoice?.invoicePayload?.invoiceNumber || '').toLowerCase().includes(searchTerm) ||
      (invoice?.status || 'draft').toLowerCase().includes(searchTerm)
    );
  });
}

// Filter invoices by status
function filterByStatus(invoices, status) {
  if (status === 'all') return invoices;
  
  return invoices.filter(invoice => {
    if (status === 'Submitted') {
      return invoice?.invoiceNumber != null;
    } else if (status === 'Draft') {
      return invoice?.invoiceNumber == null && (invoice.status === 'Draft' || invoice.status === undefined);
    } else if (status === 'Failed') {
      return invoice.status === 'Failed';
    } else {
      return invoice.status === status;
    }
  });
}

// Filter invoices by type
function filterByType(invoices, type) {
  if (type === 'all') return invoices;
  
  return invoices.filter(invoice => {
    const invoiceType = invoice?.invoiceType || invoice?.invoicePayload?.invoiceType || '';
    return invoiceType === type;
  });
}

let invoiceSortField = null;
let invoiceSortDirection = 'asc';

// Sort invoices
function sortInvoices(field) {
  if (invoiceSortField === field) {
    invoiceSortDirection = invoiceSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    invoiceSortField = field;
    invoiceSortDirection = 'asc';
  }
  
  // Update sort icons for invoice table
  document.querySelectorAll('[id^="sort-invoice-"]').forEach(icon => {
    icon.className = 'fas fa-sort';
  });
  
  const sortIcon = document.getElementById(`sort-invoice-${field}`);
  if (sortIcon) {
    sortIcon.className = `fas fa-sort-${invoiceSortDirection === 'asc' ? 'up' : 'down'}`;
  }
  
  populateInvoicesTable();
}

window.sortInvoices = sortInvoices;


// Populate invoices table
async function populateInvoicesTable() {
  let invoices = await dbGetAll(STORE_NAMES.invoices);
  const tbody = DOMElements.invoicesTableBody;

  // Get filter values
  const searchTerm = document.getElementById('invoiceSearch')?.value || '';
  const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all'; // Updated to correct ID
  const typeFilter = document.getElementById('invoiceTypeFilter')?.value || 'all'; // Added type filter
  const dateFilter = document.getElementById('dateFilter')?.value || 'all';
  const dateFrom = document.getElementById('dateFrom')?.value;
  const dateTo = document.getElementById('dateTo')?.value;
  const perPage = document.getElementById('invoicesPerPage')?.value || '20';

  // Apply filters
  let filteredInvoices = searchInvoices(invoices, searchTerm);
  filteredInvoices = filterByStatus(filteredInvoices, statusFilter);
  filteredInvoices = filterByType(filteredInvoices, typeFilter); // Added type filtering
  filteredInvoices = filterByDateRange(filteredInvoices, dateFilter, dateFrom, dateTo);

  // Apply sorting
  if (invoiceSortField) {
    filteredInvoices.sort((a, b) => {
      let aVal, bVal;
      
      switch (invoiceSortField) {
        case 'id':
          aVal = parseInt(a.id) || 0;
          bVal = parseInt(b.id) || 0;
          break;
        case 'invoiceRefNo':
          aVal = (a.invoiceRefNo || a.invoicePayload?.invoiceRefNo || '').toString();
          bVal = (b.invoiceRefNo || b.invoicePayload?.invoiceRefNo || '').toString();
          break;
        case 'invoiceDate':
          aVal = new Date(a.invoiceDate || a.dated || 0);
          bVal = new Date(b.invoiceDate || b.dated || 0);
          break;
        case 'invoiceType':
          aVal = (a.invoiceType || a.invoicePayload?.invoiceType || '').toString();
          bVal = (b.invoiceType || b.invoicePayload?.invoiceType || '').toString();
          break;
        case 'totalAmount':
          aVal = parseFloat(a.totalAmount) || 0;
          bVal = parseFloat(b.totalAmount) || 0;
          break;
        case 'status':
          aVal = (a.invoiceNumber ? 'Submitted' : (a.status || 'Draft')).toString();
          bVal = (b.invoiceNumber ? 'Submitted' : (b.status || 'Draft')).toString();
          break;
        case 'invoiceNumber':
          aVal = (a.invoiceNumber || a.invoicePayload?.invoiceNumber || '').toString();
          bVal = (b.invoiceNumber || b.invoicePayload?.invoiceNumber || '').toString();
          break;
        default:
          aVal = '';
          bVal = '';
      }
      
      if (invoiceSortField === 'invoiceDate' || invoiceSortField === 'totalAmount' || invoiceSortField === 'id') {
        // Numeric/Date sorting
        if (invoiceSortDirection === 'asc') {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      } else {
        // String sorting
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        if (invoiceSortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      }
    });
  } else {
    // Default sort by date (newest first)
    filteredInvoices.sort((a, b) => {
      const dateA = new Date( a.dated || a.invoiceDate || 0);
      const dateB = new Date( b.dated || b.invoiceDate || 0);
      return dateB - dateA;
    });
  }

  // Apply pagination
  const paginatedData = paginate(filteredInvoices, currentInvoicesPage, perPage);
  
  tbody.innerHTML = "";
  if (!filteredInvoices || filteredInvoices.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="8" style="text-align:center;color:#888;">
      No Invoice Data found in Record
      <button class="btn btn-primary" onclick="switchToCreateInvoiceTab()">Add Invoice</button>
    </td>`;
    tbody.appendChild(row);
    return;
  }

  paginatedData.data.forEach((invoice) => {
    const isSubmitted = invoice?.invoiceNumber;
    const statusText = isSubmitted ? 'Submitted' : (invoice.status || 'Draft');
    const isDraft = invoice?.status === 'Draft' || statusText === 'draft';
    
    // Calculate total amount if it's 0 or missing
    let totalAmount = parseFloat(invoice?.totalAmount) || 0;
    if (totalAmount === 0) {
      const items = invoice?.items || invoice?.invoicePayload?.items || [];
      totalAmount = calculateTotalFromLineItems(items);
    }
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${invoice?.id || "N/A"}</td>
      <td>${invoice?.invoiceRefNo || invoice?.invoicePayload?.invoiceRefNo || "N/A"}</td>
      <td>${formatDateForDisplay(invoice?.dated || invoice?.invoiceDate) || "N/A"}</td>
      <td>${invoice?.invoiceType || invoice?.invoicePayload?.invoiceType || "N/A"}</td>
      <td>${totalAmount.toFixed(2)}</td>
      <td><span class="status-badge ${isSubmitted ? 'status-submitted' : 'status-draft'}">${statusText}</span></td>
      <td>${invoice?.invoiceNumber || invoice?.invoicePayload?.invoiceNumber || ''}</td>
      <td class="action-cell" style="white-space: nowrap;">
        <button class="btn btn-view" onclick="viewInvoice('${invoice?.id}')" title="View Invoice">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-edit" onclick="editInvoice('${invoice?.id}')" 
                ${!isDraft ? 'disabled' : ''} title="Edit Invoice">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-duplicate" onclick="duplicateInvoice('${invoice?.id}')" 
                title="Duplicate Invoice">
          <i class="fas fa-copy"></i>
        </button>
        
        <button class="btn btn-delete" onclick="confirmDeleteInvoice('${invoice?.id}')" 
                ${!isDraft ? 'disabled' : ''} title="Delete Invoice">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  
  // Update pagination info and controls
  const paginationInfo = document.getElementById('invoicesPaginationInfo');


  if (paginationInfo) {
    const perPageText = perPage === 'all' ? 'All' : perPage;
    if (perPage === 'all') {
      paginationInfo.innerHTML = `Showing <select id="invoicesPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all" selected>All</option></select> of ${filteredInvoices.length} items`;
    } else {
      paginationInfo.innerHTML = `Showing <select id="invoicesPerPage" class="per-page-select"><option value="1"${perPage==='1'?' selected':''}>1</option><option value="10"${perPage==='10'?' selected':''}>10</option><option value="20"${perPage==='20'?' selected':''}>20</option><option value="50"${perPage==='50'?' selected':''}>50</option><option value="100"${perPage==='100'?' selected':''}>100</option><option value="all">All</option></select> of ${paginatedData.totalItems} items`;
    }
    // Attach event listener after updating HTML
    attachPerPageListeners();
  }
  
  createPaginationControls('invoicesPaginationControls', paginatedData.currentPage, paginatedData.totalPages, (page) => {
    currentInvoicesPage = page;
    populateInvoicesTable();
  });
}

// Helper function to format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to format date for dashboard display
// function formatDateForDisplay(dateString) {
//   if (!dateString) return 'N/A';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     year: 'numeric'
//   });
// }


// Function to calculate total amount from line items
function calculateTotalFromLineItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    return total + (parseFloat(item.totalValues) || 0);
  }, 0);
}

// Navigation helper functions
window.switchToInvoicesTab = function switchToInvoicesTab() {
  document.querySelector('[data-tab="invoices-tab"]').click();
}

window.switchToProductsTab = function switchToProductsTab() {
  document.querySelector('[data-tab="products-tab"]').click();
}

window.switchToBuyersTab = function switchToBuyersTab() {
  document.querySelector('[data-tab="buyers-tab"]').click();
}

// Global data stores
let globalInvoices = [];
let globalProducts = [];
let globalSellers = [];
let globalBuyers = [];

// Create dashboard structure dynamically
function createDashboardStructure() {
  let dashboardContainer = document.getElementById('dashboard-content');
  if (!dashboardContainer) {
    dashboardContainer = document.createElement('div');
    dashboardContainer.id = 'dashboard-content';
    dashboardContainer.className = 'dashboard-container';
    const dashboardTab = document.getElementById('dashboard-tab');
    if (dashboardTab) dashboardTab.appendChild(dashboardContainer);
  }
  
  dashboardContainer.innerHTML = `
    <div class="analytics-cards">
      ${createTimeAnalyticsHTML()}
    </div>
    <div class="dashboard-row">
      <div class="dashboard-widget">
        <div class="widget-header">
          <h3><i class="fas fa-clock"></i> Latest Invoices</h3>
          <button class="btn btn-sm btn-primary" onclick="switchToInvoicesTab()">
            <i class="fas fa-eye"></i> View All
          </button>
        </div>
        <div class="widget-content">
          <div id="latestInvoices"></div>
        </div>
      </div>
      <div class="dashboard-widget">
        <div class="widget-header">
          <h3><i class="fas fa-star"></i> Top Products</h3>
          <button class="btn btn-sm btn-primary" onclick="switchToProductsTab()">
            <i class="fas fa-eye"></i> View All
          </button>
        </div>
        <div class="widget-content">
          <div id="topProducts"></div>
        </div>
      </div>
    </div>
    <div class="dashboard-row">
      <div class="dashboard-widget">
        <div class="widget-header">
          <h3><i class="fas fa-trophy"></i> Top Buyers</h3>
          <button class="btn btn-sm btn-primary" onclick="switchToBuyersTab()">
            <i class="fas fa-eye"></i> View All
          </button>
        </div>
        <div class="widget-content">
          <div id="topBuyers"></div>
        </div>
      </div>
      <div class="dashboard-widget">
        <div class="widget-header">
          <h3><i class="fas fa-chart-pie"></i> Invoice Status</h3>
        </div>
        <div class="widget-content">
          <div id="statusChart"></div>
        </div>
      </div>
    </div>
  `;
  
  return dashboardContainer;
}

// Create time analytics HTML structure
function createTimeAnalyticsHTML() {
  const periods = [
    { key: 'today', label: 'Today', icon: 'fas fa-calendar-day' },
    { key: 'yesterday', label: 'Yesterday', icon: 'fas fa-calendar-minus' },
    { key: 'thisWeek', label: 'This Week', icon: 'fas fa-calendar-week' },
    { key: 'lastWeek', label: 'Last Week', icon: 'fas fa-calendar-alt' },
    { key: 'thisMonth', label: 'This Month', icon: 'fas fa-calendar' },
    { key: 'lastMonth', label: 'Last Month', icon: 'fas fa-calendar-times' },
    { key: 'thisYear', label: 'This Year', icon: 'fas fa-calendar-check' },
    { key: 'lastYear', label: 'Last Year', icon: 'fas fa-history' }
  ];
  
  return periods.map(period => `
    <div class="analytics-card smart-card">
      <div class="card-header">
        <h4>${period.label}</h4>
      </div>
      <div class="card-metrics">
        <span id="${period.key}Count" class="count-value">0</span>
        <span class="count-label">Invoices</span>
      </div>
      <div class="totals-section">
        <div class="total-item">
          <span class="total-label">Total Amount:</span>
          <span id="${period.key}Amount" class="total-value amount">PKR 0</span>
        </div>
        <div class="total-item">
          <span class="total-label">Sales Tax:</span>
          <span id="${period.key}Tax" class="total-value tax">PKR 0</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Update dashboard with current data
function updateDashboard() {
    createDashboardStructure();
  // Update time-based analytics
  updateTimeBasedAnalytics();
  
  // Update dashboard widgets
  updateLatestInvoices();
  updateTopProducts();
  updateTopBuyers();
  updateInvoiceStatus();
}

// Helper function to get date ranges
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
  const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
  
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
  
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(thisYearStart.getTime() - 1);
  
  return {
    today: { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) },
    yesterday: { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) },
    thisWeek: { start: thisWeekStart, end: now },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    thisMonth: { start: thisMonthStart, end: now },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    thisYear: { start: thisYearStart, end: now },
    lastYear: { start: lastYearStart, end: lastYearEnd }
  };
}

// Filter invoices by date range
function filterInvoicesByDateRange(invoices, startDate, endDate) {
  return invoices.filter(inv => {
    const invDate = new Date(inv.dated || inv.invoiceDate || 0);
    return invDate >= startDate && invDate <= endDate;
  });
}

// Calculate analytics for a period
function calculatePeriodAnalytics(invoices) {
  let totalAmount = 0;
  let totalTaxes = 0;
  
  invoices.forEach(inv => {
    let invAmount = parseFloat(inv.totalAmount) || 0;
    if (invAmount === 0) {
      const items = inv.items || inv.invoicePayload?.items || [];
      invAmount = calculateTotalFromLineItems(items);
    }
    totalAmount += invAmount;
    
    const items = inv.items || inv.invoicePayload?.items || [];
    const invTaxes = items.reduce((sum, item) => sum + (parseFloat(item.salesTaxApplicable) || 0), 0);
    totalTaxes += invTaxes;
  });
  
  return { count: invoices.length, amount: totalAmount, taxes: totalTaxes };
}


// Update time-based analytics
function updateTimeBasedAnalytics() {
  const ranges = getDateRanges();
  
  const periods = [
    { key: 'today', range: ranges.today },
    { key: 'yesterday', range: ranges.yesterday },
    { key: 'thisWeek', range: ranges.thisWeek },
    { key: 'lastWeek', range: ranges.lastWeek },
    { key: 'thisMonth', range: ranges.thisMonth },
    { key: 'lastMonth', range: ranges.lastMonth },
    { key: 'thisYear', range: ranges.thisYear },
    { key: 'lastYear', range: ranges.lastYear }
  ];
  
  periods.forEach(period => {
    const filteredInvoices = filterInvoicesByDateRange(globalInvoices, period.range.start, period.range.end);
    const analytics = calculatePeriodAnalytics(filteredInvoices);
    
    const countElement = document.getElementById(`${period.key}Count`);
    const amountElement = document.getElementById(`${period.key}Amount`);
    const taxElement = document.getElementById(`${period.key}Tax`);
    
    if (countElement) {
      countElement.textContent = analytics.count;
      countElement.className = analytics.count > 0 ? 'count-value has-invoices' : 'count-value no-invoices';
    }
    if (amountElement) amountElement.textContent = `PKR ${analytics.amount.toLocaleString()}`;
    if (taxElement) taxElement.textContent = `PKR ${analytics.taxes.toLocaleString()}`;
  });
}



// Latest Invoices - Top 10 by date
function updateLatestInvoices() {
  const latest = globalInvoices
    .sort((a, b) => new Date(b.dated || b.invoiceDate || 0) - new Date(a.dated || a.invoiceDate || 0))
    .slice(0, 10);
  
  const container = document.getElementById('latestInvoices');
  if (!container) return;
  
  container.innerHTML = latest.map(inv => {
    const amount = parseFloat(inv.totalAmount) || calculateTotalFromLineItems(inv.items || inv.invoicePayload?.items || []);
    const status = inv.invoiceNumber ? 'Submitted' : 'Draft';
    return `
      <div class="invoice-item-grid">
        <span class="grid-date">${formatDateForDisplay(inv.dated || inv.invoiceDate)}</span>
        <span class="grid-ref">${inv.invoiceRefNo || inv.invoicePayload?.invoiceRefNo || 'N/A'}</span>
        <span class="grid-amount">PKR ${amount.toFixed(2)}</span>
        <span class="grid-status ${status.toLowerCase()}">${status}</span>
      </div>`;
  }).join('');
}

// Top Selling Products - Top 10 by HS Code frequency
function updateTopProducts() {
  const productMap = {};
  
  globalInvoices.forEach(inv => {
    const items = inv.items || inv.invoicePayload?.items || [];
    items.forEach(item => {
      const key = item.hsCode || item.productDescription || 'Unknown';
      if (!productMap[key]) {
        productMap[key] = { name: item.productDescription || key, hsCode: item.hsCode, type: item.saleType || 'N/A', count: 0 };
      }
      productMap[key].count++;
    });
  });
  
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const container = document.getElementById('topProducts');
  if (!container) return;
  
  container.innerHTML = topProducts.map(product => `
    <div class="product-item-grid">
      <span class="grid-name">${product.name}</span>
      <span class="grid-hs">${product.hsCode}</span>
      <span class="grid-type">${product.type}</span>
      <span class="grid-count">${product.count}</span>
    </div>`).join('');
}

// Top Buyers - Top 10 by purchase count
function updateTopBuyers() {
  const buyerMap = {};
  
  globalInvoices.forEach(inv => {
    const buyerName = inv.invoicePayload?.buyerBusinessName || 'Unknown';
    const buyerNTN = inv.invoicePayload?.buyerNTNCNIC || 'N/A';
    const key = `${buyerName}_${buyerNTN}`;
    
    if (!buyerMap[key]) {
      buyerMap[key] = { name: buyerName, ntn: buyerNTN, count: 0 };
    }
    buyerMap[key].count++;
  });
  
  const topBuyers = Object.values(buyerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const container = document.getElementById('topBuyers');
  if (!container) return;
  
  container.innerHTML = topBuyers.map(buyer => `
    <div class="buyer-item-grid">
      <span class="grid-buyer-name">${buyer.name}</span>
      <span class="grid-ntn">${buyer.ntn}</span>
      <span class="grid-purchases">${buyer.count}</span>
    </div>`).join('');
}

// Invoice Status - Top 10 status summary
function updateInvoiceStatus() {
  const statusMap = {};
  
  globalInvoices.forEach(inv => {
    const status = inv.invoiceNumber ? 'Submitted' : 'Draft';
    if (!statusMap[status]) {
      statusMap[status] = 0;
    }
    statusMap[status]++;
  });
  
  const container = document.getElementById('statusChart');
  if (!container) return;
  
  container.innerHTML = Object.entries(statusMap).map(([status, count]) => `
    <div class="status-item-grid">
      <span class="grid-indicator ${status.toLowerCase()}"></span>
      <span class="grid-status-name">${status}</span>
      <span class="grid-status-count">${count}</span>
    </div>`).join('');
}

// Initialize invoice filters
function initInvoiceFilters() {
  const searchInput = document.getElementById('invoiceSearch');
  const statusFilter = document.getElementById('invoiceStatusFilter'); // Updated to correct ID
  const typeFilter = document.getElementById('invoiceTypeFilter'); // Added type filter
  const dateFilter = document.getElementById('dateFilter');
  const customDateRange = document.getElementById('customDateRange');
  const applyDateFilter = document.getElementById('applyDateFilter');


  // Handle search input
  searchInput?.addEventListener('input', debounce(() => {
    populateInvoicesTable();
  }, 300));

  // Handle status filter
  statusFilter?.addEventListener('change', () => {
    populateInvoicesTable();
  });

  // Handle type filter
  typeFilter?.addEventListener('change', () => {
    populateInvoicesTable();
  });

  // Handle date filter
  dateFilter?.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customDateRange.style.display = 'flex';
    } else {
      customDateRange.style.display = 'none';
      populateInvoicesTable();
    }
  });

  // Handle custom date range apply button
  applyDateFilter?.addEventListener('click', () => {
    populateInvoicesTable();
  });

}


// Initial app setup - UI components and event listeners only
async function initAppComponents() {
  // Set today's date as default invoice date
  DOMElements.invoiceDate.value = getCurrentDate('YYYY-MM-DD');
  
  // Set current dates for API parameter fields with dynamic labels
  const currentDateDDMMM = getCurrentDate('DD-MMM-YYYY');
  const currentDateISO = getCurrentDate('YYYY-MM-DD');
  
  const dateField = document.getElementById('date');
  const dateIsoField = document.getElementById('date_iso');
  const postDateField = document.getElementById('post_date');
  
  if (dateField) {
    dateField.value = currentDateDDMMM;
    const dateLabel = document.querySelector('label[for="date"]');
    if (dateLabel) dateLabel.innerHTML = `<i class="far fa-calendar"></i> Date DD-MMM-YYYY (e.g. ${currentDateDDMMM})`;
  }
  
  if (dateIsoField) {
    dateIsoField.value = currentDateISO;
    const dateIsoLabel = document.querySelector('label[for="date_iso"]');
    if (dateIsoLabel) dateIsoLabel.innerHTML = `<i class="far fa-calendar"></i> Date Format: YYYY-MM-DD (e.g. ${currentDateISO})`;
  }
  
  if (postDateField) {
    postDateField.value = currentDateISO;
    const postDateLabel = document.querySelector('label[for="post_date"]');
    if (postDateLabel) postDateLabel.innerHTML = `<i class="far fa-calendar-alt"></i> POST Date Format: YYYY-MM-DD (e.g. ${currentDateISO})`;
  }

  // Initialize UI components
  initInvoiceFilters();
  initSellerFilters();
  initBuyerFilters();
  initTabNavigation();
  initModals();
  initProductModal();
  initProductFilters();
  initFormActions();
  initAPITesting();
  initPreviewModal();
  initDatabaseImportExport();

  // Toggle between production and sandbox environment
  DOMElements.modeToggle.addEventListener("change", () => {
    const isProduction = DOMElements.modeToggle.checked;
    showToast(
      "info",
      "Mode Changed",
      `You are now in ${isProduction ? "Production" : "Sandbox"} environment.`
    );
  });
}

// Populate tables and dashboard with data
async function populateTablesAndDashboard() {
  // Load global data stores
  globalProducts = await dbGetAll(STORE_NAMES.products);
  globalSellers = await dbGetAll(STORE_NAMES.sellers);
  globalInvoices = await dbGetAll(STORE_NAMES.invoices);
  globalBuyers = await dbGetAll(STORE_NAMES.buyers);

  // Populate all tables
  await populateProductsTable();
  await populateSellerSelect();
  await populateBuyerSelect();
  await populateSellersTable();
  await populateInvoicesTable();
  await populateBuyersTable();

  // Update dashboard
  updateDashboard();

  // Setup seller-specific data
  const seller = await getSelectedSeller();
  if (seller) {
    await populateInvoiceScenarios(seller.ntn);
    const token = await getToken();
    await loadProvinces(token);
    await Promise.all([loadHSCodes(), loadTransactionTypes(), loadSROSchedules()]);
  } else {
    populateProvinceSelects();
  }


  
  // Store initial app state
  initialAppState = {
    selectedSeller: globalSellers.length > 0 ? globalSellers[0].ntn : '',
    selectedBuyer: globalBuyers.length > 0 ? globalBuyers[0].ntn : '',
    invoiceType: 'Sale Invoice',
    currency: 'PKR'
  };
}

// Main initialization function
async function initApp() {
  // Migrate old local storage data to IndexedDB
  await migrateLocalStorageToIndexedDB();
  
  // Initialize UI components first
  await initAppComponents();
  
  // Load data and populate tables/dashboard
  await populateTablesAndDashboard();

    // Add dummy item to the invoice
  await addNewItem();

  // Show success message when initialization is complete
  showToast("success", "System Ready", "FBR Digital Invoicing System initialized successfully");
  console.log("FBR Digital Invoicing System initialized successfully");
}

// Update UI elements based on the current theme
function updateThemeDependentElements(theme) {
  const isDark = theme === 'dark';
  
  // Update any theme-specific elements here
  const logoIcon = document.querySelector('.logo i');
  if (logoIcon) {
    logoIcon.style.color = isDark ? '#1a3a8f' : '#0052A5';
  }
  
  // Update any other theme-dependent elements as needed
  document.documentElement.style.setProperty('--fbr-blue', isDark ? '#1a3a8f' : '#0052A5');
  document.documentElement.style.setProperty('--fbr-red', isDark ? '#c62828' : '#E31837');
  document.documentElement.style.setProperty('--fbr-light-blue', isDark ? '#1a237e' : '#e6f0ff');
  document.documentElement.style.setProperty('--fbr-light-red', isDark ? '#4a1c1c' : '#ffebee');
  document.documentElement.style.setProperty('--fbr-green', isDark ? '#2e7d32' : '#28a745');
  document.documentElement.style.setProperty('--fbr-orange', isDark ? '#ef6c00' : '#ff9800');
  document.documentElement.style.setProperty('--fbr-gray', isDark ? '#1e1e1e' : '#f8f9fa');
  document.documentElement.style.setProperty('--fbr-dark', isDark ? '#e0e0e0' : '#343a40');
}



document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme from localStorage or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Set the theme toggle state
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = savedTheme === 'dark';
    
    // Add event listener for theme toggle
    themeToggle.addEventListener('change', (e) => {
      const isDark = e.target.checked;
      const theme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Update UI elements that might need theme-specific changes
      updateThemeDependentElements(theme);
    });
  }

  initApp();
  
  // Product modal is now initialized in initProductModal()
});

// Product sorting variables
window.productSortField = '';
window.productSortDirection = 'asc';

// Sort products function
function sortProducts(field) {
  if (window.productSortField === field) {
    window.productSortDirection = window.productSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    window.productSortField = field;
    window.productSortDirection = 'asc';
  }
  
  // Update sort icons for product table
  document.querySelectorAll('[id^="sort-product-"]').forEach(icon => {
    icon.className = 'fas fa-sort';
  });
  
  const sortIcon = document.getElementById(`sort-product-${field}`);
  if (sortIcon) {
    sortIcon.className = `fas fa-sort-${window.productSortDirection === 'asc' ? 'up' : 'down'}`;
  }
  
  window.populateProductsTable();
}

// Make function globally available
window.sortProducts = sortProducts;
window.populateTablesAndDashboard = populateTablesAndDashboard;
window.initAppComponents = initAppComponents;


// Populate products table with pagination
window.populateProductsTable = async function populateProductsTable() {
  let products = await dbGetAll(STORE_NAMES.products);
  const tbody = document.getElementById('productsTableBody');
  
  if (!tbody) return;
  
  // Get filter values
  const searchTerm = document.getElementById('productSearch')?.value || '';
  const typeFilter = document.getElementById('productTypeFilter')?.value || 'all';
  const statusFilter = document.getElementById('productStatusFilter')?.value || 'all';
  const perPage = document.getElementById('productsPerPage')?.value || '20';
  
  // Apply filters
  let filteredProducts = filterProducts(searchProducts(products, searchTerm), typeFilter, statusFilter);
  
  // Apply sorting
  if (window.productSortField) {
    filteredProducts.sort((a, b) => {
      let aVal = a[window.productSortField] || '';
      let bVal = b[window.productSortField] || '';
      
      // Handle numeric fields
      if (['purchaseRate', 'saleRate', 'taxRate', 'openingStock'].includes(window.productSortField)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      
      if (window.productSortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }
  
  // Apply pagination
  const paginatedData = paginate(filteredProducts, currentProductsPage, perPage);
  
  tbody.innerHTML = '';
  
  if (!filteredProducts || filteredProducts.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="10" style="text-align: center;">
        No products found
        <button class="btn btn-primary" onclick="openAddProductModal()">Add Product</button>
      </td>
    `;
    tbody.appendChild(row);
    const paginationInfo = document.getElementById('productsPaginationInfo');
    if (paginationInfo) {
      paginationInfo.innerHTML = 'Showing <select id="productsPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20" selected>20</option><option value="50">50</option><option value="100">100</option><option value="all">All</option></select> of 0 items';
      attachPerPageListeners();
    }
    return;
  }
  
  paginatedData.data.forEach(product => {
    const row = document.createElement('tr');
    const isGoods = product.productType && !product.productType.toLowerCase().includes('service');
    const stockDisplay = isGoods ? 
      `${product.openingStock || 0}${(product.openingStock || 0) <= (product.lowStock || 0) ? ' <span style="color: red;">⚠️</span>' : ''}` : 
      '';
    
    row.innerHTML = `
      <td>${product.hsCode || ''}</td>
      <td>${product.productName || ''}</td>
      <td>${product.productType || ''}</td>
      <td>${product.uom || ''}</td>
      <td>PKR ${(product.purchaseRate || 0).toFixed(2)}</td>
      <td>PKR ${(product.saleRate || 0).toFixed(2)}</td>
      <td>${(product.taxRate || 0).toFixed(2)}%</td>
      <td>${stockDisplay}</td>
      <td><span class="status-badge ${product.status === 'Active' ? 'status-active' : 'status-inactive'}">${product.status || 'Active'}</span></td>
      <td class="action-cell">
        <button class="btn btn-view" onclick="addProductToInvoiceFromTable('${product.id}')" title="Add to Invoice">
          <i class="fas fa-plus"></i>
        </button>
        <button class="btn btn-edit" onclick="editProduct('${product.id}')" title="Edit Product">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-delete" onclick="confirmDeleteProduct('${product.id}')" title="Delete Product">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Update pagination info and controls
  const paginationInfo = document.getElementById('productsPaginationInfo');
  if (paginationInfo) {
    const perPageText = perPage === 'all' ? 'All' : perPage;
    if (perPage === 'all') {
      paginationInfo.innerHTML = `Showing <select id="productsPerPage" class="per-page-select"><option value="1">1</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all" selected>All</option></select> of ${filteredProducts.length} items`;
    } else {
      paginationInfo.innerHTML = `Showing <select id="productsPerPage" class="per-page-select"><option value="1"${perPage==='1'?' selected':''}>1</option><option value="10"${perPage==='10'?' selected':''}>10</option><option value="20"${perPage==='20'?' selected':''}>20</option><option value="50"${perPage==='50'?' selected':''}>50</option><option value="100"${perPage==='100'?' selected':''}>100</option><option value="all">All</option></select> of ${paginatedData.totalItems} items`;
    }
    // Attach event listener after updating HTML
    attachPerPageListeners();
  }
  
  createPaginationControls('productsPaginationControls', paginatedData.currentPage, paginatedData.totalPages, (page) => {
    currentProductsPage = page;
    populateProductsTable();
  });
}
// Helper function to get current date in specified format
function getBackupFileName() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `fbr-invoice-backup-${date}_${time}.json`;
}

// Function to export the entire database as a JSON file
async function exportDatabase() {
  const data = {};
  for (const storeName of Object.values(STORE_NAMES)) {
    data[storeName] = await dbGetAll(storeName);
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = getBackupFileName();
  a.click();
  URL.revokeObjectURL(url);
}

// Function to import a database from a JSON file
async function importDatabase(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    for (const storeName of Object.values(STORE_NAMES)) {
      if (data[storeName]) {
        await dbSetAll(storeName, data[storeName]);
      }
    }
    
    // Clear existing items before reloading
    items = [];
    itemCounter = 0;
    
    // Only reload data and populate tables, don't reinitialize entire app
    await populateTablesAndDashboard();
    showToast("success", "Import Complete", "Database imported successfully!");
  } catch (err) {
    console.error("Import error:", err);
    showToast("error", "Import Failed", err.message);
  }
}

// Initialize database import/export
function initDatabaseImportExport() {
  const exportBtn = document.getElementById('exportDatabaseBtn')
  const importBtn = document.getElementById('importDatabaseBtn')
  const importFile = document.getElementById('importDatabaseFile')
  const importFileName = document.getElementById('importFileName')
    const clearBtn = document.getElementById('clearDatabaseBtn');

  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportDatabase)
  }
  
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click()
    })
    
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        if (importFileName) {
          importFileName.textContent = file.name
        }
        
        if (confirm(`Import data from ${file.name}? This will merge with existing data.`)) {
          importDatabase(file)
        }
        
        // Reset file input
        e.target.value = ''
      }
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearDatabase);
  }
}


// Clear database function
async function clearDatabase() {
  const confirmed = confirm(
    'Are you sure you want to clear ALL data from the database?\n\n' +
    'This will permanently delete:\n' +
    '• All sellers\n' +
    '• All buyers\n' +
    '• All invoices\n' +
    '• All products\n' +
    '• All preferences\n' +
    '• All logs\n\n' +
    'This action cannot be undone!'
  );

  if (!confirmed) return;

  const doubleConfirm = confirm(
    'FINAL WARNING: This will delete ALL your data!\n\n' +
    'Are you absolutely sure you want to proceed?'
  );

  if (!doubleConfirm) return;

  try {
    // Delete the entire database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = async () => {
      showToast('success', 'Database Cleared', 'All data has been permanently deleted');
      
      // Reload the page to reinitialize the database
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    deleteRequest.onerror = (event) => {
      console.error('Error deleting database:', event);
      showToast('error', 'Clear Failed', 'Failed to clear database');
    };

    deleteRequest.onblocked = () => {
      showToast('warning', 'Database Blocked', 'Please close all other tabs with this application and try again');
    };

  } catch (error) {
    console.error('Clear database error:', error);
    showToast('error', 'Clear Failed', 'Failed to clear database: ' + error.message);
  }
}

// Export functionality
window.exportData = async (dataType, format) => {
  try {
    let data = [];
    let filename = '';
    let headers = [];
    
    // Get filtered data based on current table view
    switch (dataType) {
      case 'invoices':
        data = await getFilteredInvoices();
        filename = `invoices_${getCurrentDate()}`;
        headers = ['Date', 'Reference', 'Buyer', 'Total', 'Status', 'FBR Invoice Number'];
        break;
      case 'products':
        data = await getFilteredProducts();
        filename = `products_${getCurrentDate()}`;
        headers = ['HS Code', 'Product Name', 'Type', 'UoM', 'Purchase Rate', 'Sale Rate', 'Tax Rate', 'Stock', 'Status'];
        break;
      case 'sellers':
        data = await getFilteredSellers();
        filename = `sellers_${getCurrentDate()}`;
        headers = ['NTN', 'Business Name', 'Province', 'Status', 'Registration Type'];
        break;
      case 'buyers':
        data = await getFilteredBuyers();
        filename = `buyers_${getCurrentDate()}`;
        headers = ['NTN', 'Business Name', 'Province', 'Registration Type', 'Status'];
        break;
    }
    
    if (data.length === 0) {
      showToast('warning', 'No Data', 'No data available to export');
      return;
    }
    
    switch (format) {
      case 'json':
        exportToJSON(data, filename);
        break;
      case 'excel':
        exportToExcel(data, headers, filename);
        break;
      case 'pdf':
        if (dataType === 'invoices') {
          exportInvoicesToPDF(data, filename);
        } else {
          exportToPDF(data, headers, filename, dataType);
        }
        break;
    }
    
    showToast('success', 'Export Complete', `${dataType} exported successfully as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Export error:', error);
    showToast('error', 'Export Failed', error.message || 'Failed to export data');
  }
};

// Get filtered data functions
async function getFilteredInvoices() {
  const allInvoices = await dbGetAll(STORE_NAMES.invoices);
  const searchTerm = document.getElementById('invoiceSearch')?.value || '';
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  
  return allInvoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      (invoice.invoiceRefNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.buyerBusinessName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).map(invoice => ({
    id: invoice.id,
    date: formatDateForDisplay(invoice.dated || invoice.invoiceDate),
    reference: invoice.invoiceRefNo || '',
    buyer: invoice.buyerBusinessName || '',
    total: `${(invoice.totalAmount || 0).toFixed(2)} PKR`,
    status: invoice.status || 'draft',
    fbrInvoiceNumber: invoice.invoiceNumber || 'N/A'
  }));
}

async function getFilteredProducts() {
  const allProducts = await dbGetAll(STORE_NAMES.products);
  const searchTerm = document.getElementById('productSearch')?.value || '';
  const typeFilter = document.getElementById('productTypeFilter')?.value || 'all';
  const statusFilter = document.getElementById('productStatusFilter')?.value || 'all';
  
  return allProducts.filter(product => {
    const matchesSearch = !searchTerm || 
      (product.hsCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || product.productType === typeFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }).map(product => ({
    hsCode: product.hsCode || '',
    productName: product.productName || '',
    type: product.productType || '',
    uom: product.uom || '',
    purchaseRate: (product.purchaseRate || 0).toFixed(2),
    saleRate: (product.saleRate || 0).toFixed(2),
    taxRate: `${(product.taxRate || 0).toFixed(2)}%`,
    stock: product.openingStock || 0,
    status: product.status || 'Active'
  }));
}

async function getFilteredSellers() {
  const allSellers = await dbGetAll(STORE_NAMES.sellers);
  const searchTerm = document.getElementById('sellerSearch')?.value || '';
  const provinceFilter = document.getElementById('sellerProvinceFilter')?.value || 'all';
  const statusFilter = document.getElementById('sellerStatusFilter')?.value || 'all';
  
  return allSellers.filter(seller => {
    const matchesSearch = !searchTerm || 
      (seller.ntn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (seller.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = provinceFilter === 'all' || seller.province === provinceFilter;
    const matchesStatus = statusFilter === 'all' || seller.registrationStatus === statusFilter;
    
    return matchesSearch && matchesProvince && matchesStatus;
  }).map(seller => ({
    ntn: seller.ntn || '',
    businessName: seller.businessName || '',
    province: seller.province || '',
    status: seller.registrationStatus || 'Unknown',
    registrationType: seller.registrationType || 'Unknown'
  }));
}

async function getFilteredBuyers() {
  const allBuyers = await dbGetAll(STORE_NAMES.buyers);
  const searchTerm = document.getElementById('buyerSearch')?.value || '';
  const provinceFilter = document.getElementById('buyerProvinceFilter')?.value || 'all';
  const statusFilter = document.getElementById('buyerStatusFilter')?.value || 'all';
  
  return allBuyers.filter(buyer => {
    const matchesSearch = !searchTerm || 
      (buyer.ntn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (buyer.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = provinceFilter === 'all' || buyer.province === provinceFilter;
    const matchesStatus = statusFilter === 'all' || buyer.registrationStatus === statusFilter;
    
    return matchesSearch && matchesProvince && matchesStatus;
  }).map(buyer => ({
    ntn: buyer.ntn || '',
    businessName: buyer.businessName || '',
    province: buyer.province || '',
    registrationType: buyer.registrationType || '',
    status: buyer.registrationStatus || 'Unknown'
  }));
}

// Export to JSON
function exportToJSON(data, filename) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export to Excel (CSV format)
function exportToExcel(data, headers, filename) {
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      let value = '';
      
      // Map headers to data keys
      switch (key) {
        case 'date': value = row.date || ''; break;
        case 'reference': value = row.reference || ''; break;
        case 'buyer': value = row.buyer || ''; break;
        case 'total': value = row.total || ''; break;
        case 'status': value = row.status || ''; break;
        case 'fbrinvoicenumber': value = row.fbrInvoiceNumber || ''; break;
        case 'hscode': value = row.hsCode || ''; break;
        case 'productname': value = row.productName || ''; break;
        case 'type': value = row.type || ''; break;
        case 'uom': value = row.uom || ''; break;
        case 'purchaserate': value = row.purchaseRate || ''; break;
        case 'salerate': value = row.saleRate || ''; break;
        case 'taxrate': value = row.taxRate || ''; break;
        case 'stock': value = row.stock || ''; break;
        case 'ntn': value = row.ntn || ''; break;
        case 'businessname': value = row.businessName || ''; break;
        case 'province': value = row.province || ''; break;
        case 'registrationtype': value = row.registrationType || ''; break;
        default: value = row[key] || '';
      }
      
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export to PDF
function exportToPDF(data, headers, filename, dataType) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('error', 'PDF Error', 'PDF library not loaded');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Export Report`, 20, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on: ${formatDateForDisplay(new Date())}`, 20, 30);
  
  // Table
  let y = 45;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const rowHeight = 8;
  const colWidth = (doc.internal.pageSize.width - 2 * margin) / headers.length;
  
  // Headers
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setFillColor(240, 240, 240);
  
  headers.forEach((header, i) => {
    const x = margin + i * colWidth;
    doc.rect(x, y, colWidth, rowHeight, 'F');
    doc.rect(x, y, colWidth, rowHeight);
    doc.text(header, x + 2, y + 5);
  });
  
  y += rowHeight;
  doc.setFont(undefined, 'normal');
  
  // Data rows
  data.forEach((row, rowIndex) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      
      // Redraw headers on new page
      doc.setFont(undefined, 'bold');
      doc.setFillColor(240, 240, 240);
      headers.forEach((header, i) => {
        const x = margin + i * colWidth;
        doc.rect(x, y, colWidth, rowHeight, 'F');
        doc.rect(x, y, colWidth, rowHeight);
        doc.text(header, x + 2, y + 5);
      });
      y += rowHeight;
      doc.setFont(undefined, 'normal');
    }
    
    headers.forEach((header, i) => {
      const x = margin + i * colWidth;
      const key = header.toLowerCase().replace(/\s+/g, '');
      let value = '';
      
      // Map headers to data keys (same as Excel export)
      switch (key) {
        case 'date': value = row.date || ''; break;
        case 'reference': value = row.reference || ''; break;
        case 'buyer': value = row.buyer || ''; break;
        case 'total': value = row.total || ''; break;
        case 'status': value = row.status || ''; break;
        case 'fbrinvoicenumber': value = row.fbrInvoiceNumber || ''; break;
        case 'hscode': value = row.hsCode || ''; break;
        case 'productname': value = row.productName || ''; break;
        case 'type': value = row.type || ''; break;
        case 'uom': value = row.uom || ''; break;
        case 'purchaserate': value = row.purchaseRate || ''; break;
        case 'salerate': value = row.saleRate || ''; break;
        case 'taxrate': value = row.taxRate || ''; break;
        case 'stock': value = row.stock || ''; break;
        case 'ntn': value = row.ntn || ''; break;
        case 'businessname': value = row.businessName || ''; break;
        case 'province': value = row.province || ''; break;
        case 'registrationtype': value = row.registrationType || ''; break;
        default: value = row[key] || '';
      }
      
      doc.rect(x, y, colWidth, rowHeight);
      const text = doc.splitTextToSize(String(value), colWidth - 4);
      doc.text(text, x + 2, y + 5);
    });
    
    y += rowHeight;
  });
  
  doc.save(`${filename}.pdf`);
}

// Export invoices to PDF with full invoice format
async function exportInvoicesToPDF(invoices, filename) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('error', 'PDF Error', 'PDF library not loaded');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  for (let i = 0; i < invoices.length; i++) {
    if (i > 0) doc.addPage();
    
    const invoice = await dbGet(STORE_NAMES.invoices, invoices[i].id);
    if (invoice) {
      await generateSingleInvoicePDF(doc, invoice, false);
    }
  }
  
  doc.save(`${filename}.pdf`);
}

// Generate single invoice PDF (simplified version)
async function generateSingleInvoicePDF(doc, invoice, isNewDoc = true) {
  const margin = 10;
  let y = margin + 10;
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 15;
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Reference: ${invoice.invoiceRefNo || ''}`, margin, y);
  doc.text(`Date: ${formatDateForDisplay(invoice.dated || invoice.invoiceDate)}`, margin + 100, y);
  y += 10;
  
  doc.text(`Seller: ${invoice.sellerBusinessName || ''}`, margin, y);
  y += 6;
  doc.text(`Buyer: ${invoice.buyerBusinessName || ''}`, margin, y);
  y += 6;
  doc.text(`Total: ${(invoice.totalAmount || 0).toFixed(2)} PKR`, margin, y);
  y += 6;
  doc.text(`Status: ${invoice.status || 'draft'}`, margin, y);
  
  if (invoice.invoiceNumber) {
    y += 6;
    doc.text(`FBR Invoice Number: ${invoice.invoiceNumber}`, margin, y);
  }
}

// === Global Exports for Components ===
// Export essential functions and objects to window for use by components
window.dbGetAll = dbGetAll;
window.dbGet = dbGet;
window.dbSet = dbSet;
window.dbDelete = dbDelete;
window.dbSetAll = dbSetAll;
window.STORE_NAMES = STORE_NAMES;
window.exportData = exportData;
window.formatDateForDisplay = formatDateForDisplay;
window.showToast = showToast;

// Expose table population functions for component integration
window.populateInvoicesTable = populateInvoicesTable;
window.populateProductsTable = populateProductsTable;
window.populateSellersTable = populateSellersTable;
window.populateBuyersTable = populateBuyersTable;

// Expose modal functions for component action buttons
window.openAddProductModal = openAddProductModal;
window.openAddSellerModal = () => {
  const addSellerBtn = document.getElementById('addSellerBtn');
  if (addSellerBtn) addSellerBtn.click();
};
window.openAddBuyerModal = () => {
  const addBuyerBtn = document.getElementById('addBuyerBtn');
  if (addBuyerBtn) addBuyerBtn.click();
};

// Expose navigation function
window.switchToCreateInvoiceTab = switchToCreateInvoiceTab;

// Make functions global for HTML onclick handlers
window.removeScenarioChip = removeScenarioChip;
window.populateTablesAndDashboard = populateTablesAndDashboard;
window.initAppComponents = initAppComponents;

console.log('✓ Database functions exported globally for components');
console.log('✓ FBR Digital Invoicing App initialized successfully');

// Test functions for modal functionality - can be called from console for testing
window.testErrorModal = function() {
  const testError = new Error("This is a test validation error with detailed information");
  const testErrorDetails = {
    errorCode: "TEST001",
    timestamp: new Date().toISOString(),
    submissionPayload: {
      invoiceRefNo: "SI-TEST-001",
      invoiceDate: "2024-01-15",
      currency: "PKR",
      items: [
        {
          productDescription: "Test Product",
          quantity: 1,
          unitPrice: 1000,
          taxRate: 17
        }
      ]
    },
    validationErrors: [
      {
        field: "seller.ntn",
        message: "Invalid NTN format",
        code: "INVALID_NTN"
      },
      {
        field: "buyer.registrationStatus",
        message: "Buyer registration status is inactive",
        code: "INACTIVE_BUYER"
      },
      {
        field: "items[0].hsCode",
        message: "HS Code is required for all items",
        code: "MISSING_HS_CODE"
      }
    ],
    response: {
      status: "failed",
      statusCode: 400,
      message: "Test validation failed with multiple errors",
      details: "This is a comprehensive test error to verify the full-width modal functionality. The error details container should now take up the full width and height available in the modal, making it easier to read detailed error information, stack traces, and debugging data.",
      stackTrace: "Error: Test validation failed\n    at testErrorModal (app.js:7689)\n    at HTMLButtonElement.<anonymous> (app.js:7712)\n    at Object.handleSubmissionError (app.js:1746)\n    at Object.displayErrorModal (app.js:1752)"
    }
  };
  
  console.log("Testing error modal with detailed sample data:", testErrorDetails);
  handleSubmissionError(testError, testErrorDetails);
};

// Test function for success modal
window.testSuccessModal = function() {
  const testResponse = {
    fbrInvoiceNumber: "TEST-12345",
    invoiceNumber: "SI-TEST-001", 
    dated: new Date().toISOString(),
    status: "submitted",
    validationResponse: {
      invoiceStatuses: [
        {
          itemSNo: "1",
          statusCode: "200",
          invoiceNo: "SI-TEST-001",
          status: "Success",
          errorCode: "",
          error: ""
        }
      ]
    }
  };
  
  console.log("Testing success modal with sample data:", testResponse);
  displaySuccessModal(testResponse);
};

console.log('✓ Modal test functions available:');
console.log('  - testErrorModal(): Test error modal display');
console.log('  - testSuccessModal(): Test success modal display');
console.log('  - testPreviewModal(): Test preview modal initialization');
console.log('  - testTabSwitching(): Test tab switching functionality in success modal');
console.log('');
console.log('🔧 Quick test: Run testTabSwitching() to verify tab functionality');
console.log('📋 Quick test: Run testSuccessModal() to test success modal');

// Simple quick test function that can be called immediately
window.quickTabTest = function() {
  console.log('🚀 Running quick tab test...');
  testSuccessModal();
  setTimeout(() => {
    console.log('Testing tab clicks...');
    const jsonBtn = document.querySelector('.tab-nav button[data-tab="json-tab"]');
    const tableBtn = document.querySelector('.tab-nav button[data-tab="table-tab"]');
    
    if (jsonBtn && tableBtn) {
      console.log('Clicking JSON tab...');
      jsonBtn.click();
      setTimeout(() => {
        console.log('Clicking Table tab...');
        tableBtn.click();
        console.log('✅ Quick test completed - check if tabs switched!');
      }, 1000);
    }
  }, 1000);
};

// Test function for tab switching
window.testTabSwitching = function() {
  console.log('=== Testing tab switching functionality ===');
  
  // First open the success modal with test data
  const testResponse = {
    fbrInvoiceNumber: "TAB-TEST-12345",
    invoiceNumber: "SI-TAB-TEST-001", 
    dated: new Date().toISOString(),
    status: "submitted",
    validationResponse: {
      invoiceStatuses: [
        {
          itemSNo: "1",
          statusCode: "200",
          invoiceNo: "SI-TAB-TEST-001",
          status: "Success",
          errorCode: "",
          error: ""
        }
      ]
    }
  };
  
  console.log('Opening success modal with test data...');
  displaySuccessModal(testResponse);
  
  // Test tab switching after a short delay
  setTimeout(() => {
    console.log('=== Starting tab button tests ===');
    
    // Test clicking JSON tab
    const jsonTabBtn = document.querySelector('.tab-nav button[data-tab="json-tab"]');
    const tableTabBtn = document.querySelector('.tab-nav button[data-tab="table-tab"]');
    const jsonTabContent = document.getElementById('json-tab');
    const tableTabContent = document.getElementById('table-tab');
    
    console.log('Elements found:', {
      jsonTabBtn: !!jsonTabBtn,
      tableTabBtn: !!tableTabBtn,
      jsonTabContent: !!jsonTabContent,
      tableTabContent: !!tableTabContent
    });
    
    if (jsonTabBtn && tableTabBtn && jsonTabContent && tableTabContent) {
      console.log('\n=== Testing JSON Tab Click ===');
      jsonTabBtn.click();
      
      setTimeout(() => {
        const jsonActive = jsonTabBtn.classList.contains('tab-active');
        const jsonVisible = jsonTabContent.classList.contains('active');
        const tableInactive = !tableTabBtn.classList.contains('tab-active');
        const tableHidden = !tableTabContent.classList.contains('active');
        
        console.log('JSON tab results:', {
          buttonActive: jsonActive,
          contentVisible: jsonVisible,
          jsonDisplay: getComputedStyle(jsonTabContent).display,
          tableDisplay: getComputedStyle(tableTabContent).display
        });
        
        console.log('\n=== Testing Table Tab Click ===');
        tableTabBtn.click();
        
        setTimeout(() => {
          const tableActive = tableTabBtn.classList.contains('tab-active');
          const tableVisible = tableTabContent.classList.contains('active');
          const jsonInactive = !jsonTabBtn.classList.contains('tab-active');
          const jsonHidden = !jsonTabContent.classList.contains('active');
          
          console.log('Table tab results:', {
            buttonActive: tableActive,
            contentVisible: tableVisible,
            tableDisplay: getComputedStyle(tableTabContent).display,
            jsonDisplay: getComputedStyle(jsonTabContent).display
          });
          
          const allTestsPassed = jsonActive && jsonVisible && tableInactive && tableHidden && 
                                 tableActive && tableVisible && jsonInactive && jsonHidden;
          
          if (allTestsPassed) {
            console.log('\n✅ ALL TAB SWITCHING TESTS PASSED!');
            showToast('success', 'Tab Test Complete', 'All tab switching functionality working correctly!');
          } else {
            console.log('\n❌ Some tab switching tests failed. Check logs above.');
            showToast('error', 'Tab Test Failed', 'Some tab functionality issues detected. Check console.');
          }
        }, 200);
      }, 200);
    } else {
      console.error('❌ Required tab elements not found!');
      showToast('error', 'Tab Test Failed', 'Required elements not found');
    }
  }, 1000);
};

// Test function for preview modal initialization
window.testPreviewModal = function() {
  try {
    initPreviewModal();
    console.log('Preview modal initialization test passed');
    showToast('success', 'Test Passed', 'Preview modal initialized successfully');
  } catch (error) {
    console.error('Preview modal initialization test failed:', error);
    showToast('error', 'Test Failed', 'Preview modal initialization failed: ' + error.message);
  }
};