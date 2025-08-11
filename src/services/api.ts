import { Invoice, Seller, Buyer, Product } from '../types';

// Mock data for development - replace with actual API calls
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    sellerName: 'ABC Corporation',
    buyerName: 'XYZ Ltd',
    totalAmount: 50000,
    taxAmount: 8000,
    status: 'approved',
    createdAt: '2024-01-15T10:30:00Z',
    submittedAt: '2024-01-15T11:00:00Z',
    items: [
      {
        id: '1',
        description: 'Software License',
        quantity: 1,
        unitPrice: 50000,
        taxRate: 16,
        hsCode: '85234910',
        amount: 50000,
      },
    ],
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    sellerName: 'ABC Corporation',
    buyerName: 'DEF Industries',
    totalAmount: 75000,
    taxAmount: 12000,
    status: 'submitted',
    createdAt: '2024-01-16T14:20:00Z',
    submittedAt: '2024-01-16T15:00:00Z',
    items: [
      {
        id: '2',
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 7500,
        taxRate: 16,
        hsCode: '85234920',
        amount: 75000,
      },
    ],
  },
];

const mockSellers: Seller[] = [
  {
    id: '1',
    name: 'ABC Corporation',
    ntn: '1234567-8',
    address: '123 Business Street, Karachi',
    apiToken: 'sandbox_token_123',
    environment: 'sandbox',
  },
];

const mockBuyers: Buyer[] = [
  {
    id: '1',
    name: 'XYZ Ltd',
    ntn: '9876543-2',
    address: '456 Client Avenue, Lahore',
    registrationStatus: 'registered',
  },
  {
    id: '2',
    name: 'DEF Industries',
    cnic: '12345-6789012-3',
    address: '789 Customer Road, Islamabad',
    registrationStatus: 'unregistered',
  },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Software License',
    description: 'Annual software license',
    hsCode: '85234910',
    unitPrice: 50000,
    taxRate: 16,
    uom: 'Each',
  },
  {
    id: '2',
    name: 'Consulting Services',
    description: 'Professional consulting services',
    hsCode: '85234920',
    unitPrice: 7500,
    taxRate: 16,
    uom: 'Hour',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    await delay(500);
    return mockInvoices;
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    await delay(800);
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    await delay(600);
    const index = mockInvoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    
    mockInvoices[index] = { ...mockInvoices[index], ...updates };
    return mockInvoices[index];
  },

  async deleteInvoice(id: string): Promise<void> {
    await delay(400);
    const index = mockInvoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    mockInvoices.splice(index, 1);
  },

  // Seller operations
  async getSellers(): Promise<Seller[]> {
    await delay(300);
    return mockSellers;
  },

  async createSeller(seller: Omit<Seller, 'id'>): Promise<Seller> {
    await delay(500);
    const newSeller: Seller = {
      ...seller,
      id: Date.now().toString(),
    };
    mockSellers.push(newSeller);
    return newSeller;
  },

  // Buyer operations
  async getBuyers(): Promise<Buyer[]> {
    await delay(300);
    return mockBuyers;
  },

  async createBuyer(buyer: Omit<Buyer, 'id'>): Promise<Buyer> {
    await delay(500);
    const newBuyer: Buyer = {
      ...buyer,
      id: Date.now().toString(),
    };
    mockBuyers.push(newBuyer);
    return newBuyer;
  },

  // Product operations
  async getProducts(): Promise<Product[]> {
    await delay(300);
    return mockProducts;
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await delay(500);
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  // FBR API operations (mock implementations)
  async validateInvoice(invoiceData: any): Promise<{ valid: boolean; errors?: string[] }> {
    await delay(1000);
    // Mock validation - in real app, this would call FBR API
    return { valid: true };
  },

  async submitToFBR(invoiceData: any): Promise<{ success: boolean; fbrId?: string }> {
    await delay(1500);
    // Mock submission - in real app, this would call FBR API
    return { success: true, fbrId: `FBR-${Date.now()}` };
  },
};