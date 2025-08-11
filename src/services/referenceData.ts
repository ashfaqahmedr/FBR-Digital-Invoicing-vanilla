export interface HSCode {
  code: string;
  description: string;
}

export interface Province { id: string; name: string }
export interface TransactionType { id: string; name: string }
export interface UOM { id: string; name: string }
export interface TaxRate { saleType: string; rate: number }
export interface SroSchedule { id: string; title: string }

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_HS_CODES: HSCode[] = [
  { code: '85234910', description: 'Software license' },
  { code: '85234920', description: 'Consulting services' },
  { code: '10063010', description: 'Basmati rice' },
  { code: '27101943', description: 'Lubricating oils' },
];

const PROVINCES: Province[] = [
  { id: 'PK-IS', name: 'Islamabad Capital Territory' },
  { id: 'PK-PB', name: 'Punjab' },
  { id: 'PK-SD', name: 'Sindh' },
  { id: 'PK-KP', name: 'Khyber Pakhtunkhwa' },
  { id: 'PK-BA', name: 'Balochistan' },
  { id: 'PK-GB', name: 'Gilgit-Baltistan' },
  { id: 'PK-AK', name: 'Azad Jammu & Kashmir' },
];

const TRANSACTION_TYPES: TransactionType[] = [
  { id: 'sale', name: 'Sale' },
  { id: 'debit', name: 'Debit Note' },
  { id: 'credit', name: 'Credit Note' },
  { id: 'return', name: 'Sales Return' },
];

const UOMS: UOM[] = [
  { id: 'EA', name: 'Each' },
  { id: 'KG', name: 'Kilogram' },
  { id: 'LT', name: 'Litre' },
  { id: 'HR', name: 'Hour' },
];

const TAX_RATES: TaxRate[] = [
  { saleType: 'Standard', rate: 16 },
  { saleType: 'Reduced', rate: 8 },
  { saleType: 'Zero Rated', rate: 0 },
  { saleType: 'Exempt', rate: 0 },
];

const SRO_SCHEDULES: SroSchedule[] = [
  { id: 'SRO-1125', title: 'SRO 1125 - Textile' },
  { id: 'SRO-123', title: 'SRO 123 - Special exemptions' },
];

export const referenceData = {
  async searchHsCodes(query: string): Promise<HSCode[]> {
    await delay(150);
    const q = query.toLowerCase();
    return MOCK_HS_CODES.filter(h => h.code.includes(q) || h.description.toLowerCase().includes(q)).slice(0, 20);
  },
  async getProvinces(): Promise<Province[]> {
    await delay(100);
    return PROVINCES;
  },
  async getTransactionTypes(): Promise<TransactionType[]> {
    await delay(100);
    return TRANSACTION_TYPES;
  },
  async getUom(): Promise<UOM[]> {
    await delay(100);
    return UOMS;
  },
  async getTaxRates(): Promise<TaxRate[]> {
    await delay(100);
    return TAX_RATES;
  },
  async getSroSchedules(): Promise<SroSchedule[]> {
    await delay(100);
    return SRO_SCHEDULES;
  },
};