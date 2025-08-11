const API_URLS = {
  submit: {
    sandbox: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata',
    production: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata',
  },
  hsCodes: 'https://gw.fbr.gov.pk/pdi/v1/itemdesccode',
  provinces: 'https://gw.fbr.gov.pk/pdi/v1/provinces',
  transactionTypes: 'https://gw.fbr.gov.pk/pdi/v1/transtypecode',
  uom: 'https://gw.fbr.gov.pk/pdi/v1/uom',
  saleTypeToRate: 'https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate',
  SroSchedule: 'https://gw.fbr.gov.pk/pdi/v1/SroSchedule',
  sroitemcode: 'https://gw.fbr.gov.pk/pdi/v1/sroitemcode',
};

export type Environment = 'sandbox' | 'production';

async function fetchWithAuth(url: string, token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(url + qs, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`FBR API error ${res.status}`);
  return res.json();
}

export const fbr = {
  async getProvinces(token: string) {
    return fetchWithAuth(API_URLS.provinces, token);
  },
  async getUOM(token: string) {
    return fetchWithAuth(API_URLS.uom, token);
  },
  async getSaleTypeToRate(token: string, saleType: string) {
    return fetchWithAuth(API_URLS.saleTypeToRate, token, { saleType });
  },
  async getSroSchedule(token: string) {
    return fetchWithAuth(API_URLS.SroSchedule, token);
  },
  async getSroItems(token: string, sroId: string) {
    return fetchWithAuth(API_URLS.sroitemcode, token, { sroId });
  },
  async searchHsCodes(token: string, query: string) {
    return fetchWithAuth(API_URLS.hsCodes, token, { q: query });
  },
};