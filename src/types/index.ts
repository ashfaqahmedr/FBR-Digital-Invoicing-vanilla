export interface Invoice {
  id: string;
  invoiceNumber: string;
  sellerName: string;
  buyerName: string;
  totalAmount: number;
  taxAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  submittedAt?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  hsCode: string;
  amount: number;
}

export interface Seller {
  id: string;
  name: string;
  ntn: string;
  address: string;
  apiToken: string;
  environment: 'sandbox' | 'production';
  // Parity with vanilla app (optional fields)
  businessName?: string;
  businessActivity?: string;
  province?: string;
  sandboxToken?: string;
  productionToken?: string;
  registrationStatus?: string;
  registrationType?: string;
  lastSaleInvoiceId?: string;
  lastDebitNoteId?: string;
}

export interface Buyer {
  id: string;
  name: string;
  ntn?: string;
  cnic?: string;
  address: string;
  registrationStatus: 'registered' | 'unregistered';
  // Additional optional fields for parity
  province?: string;
  registrationType?: string;
  businessName?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  hsCode: string;
  unitPrice: number;
  taxRate: number;
  uom: string;
}

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  approvedInvoices: number;
  monthlyGrowth: number;
  averageInvoiceValue: number;
}

export interface ChartData {
  name: string;
  value: number;
  month?: string;
  revenue?: number;
  invoices?: number;
}