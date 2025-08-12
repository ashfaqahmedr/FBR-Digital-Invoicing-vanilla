import React from 'react';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoiceTable } from '../components/invoices/InvoiceTable';

export function Home() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column - Invoice Form */}
      <div>
        <InvoiceForm />
      </div>
      
      {/* Right Column - Invoice Table */}
      <div>
        <InvoiceTable />
      </div>
    </div>
  );
}