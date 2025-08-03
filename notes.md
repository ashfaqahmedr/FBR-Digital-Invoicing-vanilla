### Can not Add Product from Products
app.js:1620  GET https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=2025-08-02&transTypeId=18&originationSupplier=8 500 (Internal Server Error)
fetchWithAuth @ app.js:1620
await in fetchWithAuth
fetchTaxRateOptions @ app.js:1779
addProductToInvoice @ app.js:2375
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1
app.js:1620  GET https://gw.fbr.gov.pk/pdi/v1/SroSchedule?rate_id=undefined&date=02-AUG-2025&origination_supplier_csv=8 500 (Internal Server Error)
fetchWithAuth @ app.js:1620
await in fetchWithAuth
fetchSroSchedules @ app.js:1795
addProductToInvoice @ app.js:2385
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1
app.js:1805 Failed to fetch SRO Schedules: Error: Unexpected response format for SRO Schedules
    at fetchSroSchedules (app.js:1802:13)
    at async addProductToInvoice (app.js:2385:31)
    at async window.addProductToInvoiceFromTable (app.js:2434:5)
overrideMethod @ hook.js:608
fetchSroSchedules @ app.js:1805
await in fetchSroSchedules
addProductToInvoice @ app.js:2385
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1


index.html:1 Unchecked runtime.lastError: The message port closed before a response was received.
index.html:1 Unchecked runtime.lastError: The message port closed before a response was received.
app.js:1620  GET https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=2025-08-02&transTypeId=18&originationSupplier=8 500 (Internal Server Error)
fetchWithAuth @ app.js:1620
await in fetchWithAuth
fetchTaxRateOptions @ app.js:1779
addProductToInvoice @ app.js:2375
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1
app.js:1620  GET https://gw.fbr.gov.pk/pdi/v1/SroSchedule?rate_id=undefined&date=02-AUG-2025&origination_supplier_csv=8 500 (Internal Server Error)
fetchWithAuth @ app.js:1620
await in fetchWithAuth
fetchSroSchedules @ app.js:1795
addProductToInvoice @ app.js:2385
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1
app.js:1805 Failed to fetch SRO Schedules: Error: Unexpected response format for SRO Schedules
    at fetchSroSchedules (app.js:1802:13)
    at async addProductToInvoice (app.js:2385:31)
    at async window.addProductToInvoiceFromTable (app.js:2434:5)
overrideMethod @ hook.js:608
fetchSroSchedules @ app.js:1805
await in fetchSroSchedules
addProductToInvoice @ app.js:2385
await in addProductToInvoice
window.addProductToInvoiceFromTable @ app.js:2434
await in window.addProductToInvoiceFromTable
onclick @ index.html:1
