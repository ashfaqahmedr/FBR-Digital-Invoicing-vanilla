import { Invoice, Seller, Buyer, Product } from '../types';
import { dbGetAll, dbPut, dbDelete, STORE_NAMES } from './db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const api = {
  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    await delay(100);
    return dbGetAll<Invoice>(STORE_NAMES.invoices);
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    await delay(100);
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await dbPut(STORE_NAMES.invoices, newInvoice);
    return newInvoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    await delay(100);
    const all = await dbGetAll<Invoice>(STORE_NAMES.invoices);
    const existing = all.find(i => i.id === id);
    if (!existing) throw new Error('Invoice not found');
    const updated = { ...existing, ...updates } as Invoice;
    await dbPut(STORE_NAMES.invoices, updated);
    return updated;
  },

  async deleteInvoice(id: string): Promise<void> {
    await delay(100);
    await dbDelete(STORE_NAMES.invoices, id);
  },

  // Seller operations
  async getSellers(): Promise<Seller[]> {
    await delay(100);
    return dbGetAll<Seller>(STORE_NAMES.sellers);
  },

  async createSeller(seller: Omit<Seller, 'id'>): Promise<Seller> {
    await delay(100);
    const newSeller: Seller = { ...seller, id: generateId() } as Seller;
    await dbPut(STORE_NAMES.sellers, newSeller);
    return newSeller;
  },

  async updateSeller(id: string, updates: Partial<Seller>): Promise<Seller> {
    await delay(100);
    const all = await dbGetAll<Seller>(STORE_NAMES.sellers);
    const existing = all.find(s => s.id === id);
    if (!existing) throw new Error('Seller not found');
    const updated = { ...existing, ...updates } as Seller;
    await dbPut(STORE_NAMES.sellers, updated);
    return updated;
  },

  async deleteSeller(id: string): Promise<void> {
    await delay(100);
    await dbDelete(STORE_NAMES.sellers, id);
  },

  // Buyer operations
  async getBuyers(): Promise<Buyer[]> {
    await delay(100);
    return dbGetAll<Buyer>(STORE_NAMES.buyers);
  },

  async createBuyer(buyer: Omit<Buyer, 'id'>): Promise<Buyer> {
    await delay(100);
    const newBuyer: Buyer = { ...buyer, id: generateId() } as Buyer;
    await dbPut(STORE_NAMES.buyers, newBuyer);
    return newBuyer;
  },

  async updateBuyer(id: string, updates: Partial<Buyer>): Promise<Buyer> {
    await delay(100);
    const all = await dbGetAll<Buyer>(STORE_NAMES.buyers);
    const existing = all.find(b => b.id === id);
    if (!existing) throw new Error('Buyer not found');
    const updated = { ...existing, ...updates } as Buyer;
    await dbPut(STORE_NAMES.buyers, updated);
    return updated;
  },

  async deleteBuyer(id: string): Promise<void> {
    await delay(100);
    await dbDelete(STORE_NAMES.buyers, id);
  },

  // Product operations
  async getProducts(): Promise<Product[]> {
    await delay(100);
    return dbGetAll<Product>(STORE_NAMES.products);
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await delay(100);
    const newProduct: Product = { ...product, id: generateId() } as Product;
    await dbPut(STORE_NAMES.products, newProduct);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await delay(100);
    const all = await dbGetAll<Product>(STORE_NAMES.products);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Product not found');
    const updated = { ...existing, ...updates } as Product;
    await dbPut(STORE_NAMES.products, updated);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    await delay(100);
    await dbDelete(STORE_NAMES.products, id);
  },

  // FBR API placeholders (can be wired later)
  async validateInvoice(_invoiceData: any): Promise<{ valid: boolean; errors?: string[] }> {
    await delay(200);
    return { valid: true };
  },

  async submitToFBR(_invoiceData: any): Promise<{ success: boolean; fbrId?: string }> {
    await delay(300);
    return { success: true, fbrId: `FBR-${Date.now()}` };
  },
};