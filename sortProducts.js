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
  window.populateProductsTable();
}

// Make function globally available
window.sortProducts = sortProducts;