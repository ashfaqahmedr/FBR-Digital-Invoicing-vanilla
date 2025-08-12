const API_URLS = {
  validate: {
    sandbox: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb',
    production: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata',
  },
  submit: {
    sandbox: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb',
    production: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata',
  },
  hsCodes: 'https://gw.fbr.gov.pk/pdi/v1/itemdesccode',
  provinces: 'https://gw.fbr.gov.pk/pdi/v1/provinces',
  transactionTypes: 'https://gw.fbr.gov.pk/pdi/v1/transtypecode',
  uom: 'https://gw.fbr.gov.pk/pdi/v1/uom',
  saleTypeToRate: 'https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate',
  hsUom: 'https://gw.fbr.gov.pk/pdi/v2/HS_UOM',
  SroSchedule: 'https://gw.fbr.gov.pk/pdi/v1/SroSchedule',
  sroitemcode: 'https://gw.fbr.gov.pk/pdi/v1/sroitemcode',
  SROItem: 'https://gw.fbr.gov.pk/pdi/v2/SROItem',
};

export type Environment = 'sandbox' | 'production';

function formatDateDDMonYYYY(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase();
}

function formatDateYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchWithAuth(url: string, token: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(url + qs, {
    headers: {
      Authorization: `${token.startsWith('Bearer') ? token : 'Bearer ' + token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`FBR API error ${res.status}`);
  return res.json();
}

export const fbr = {
  formatDateDDMonYYYY,
  formatDateYYYYMMDD,
  async getProvinces(token: string) { return fetchWithAuth(API_URLS.provinces, token); },
  async getUOM(token: string) { return fetchWithAuth(API_URLS.uom, token); },
  async getSaleTypeToRate(token: string, saleType: string) { return fetchWithAuth(API_URLS.saleTypeToRate, token, { saleType }); },
  async getSroSchedule(token: string, rateId?: string | number, dateDDMonYYYY?: string, provinceCsv?: string) {
    const params: Record<string, string> = {};
    if (rateId !== undefined) params['rate_id'] = String(rateId);
    if (dateDDMonYYYY) params['date'] = dateDDMonYYYY;
    if (provinceCsv) params['origination_supplier_csv'] = provinceCsv;
    return fetchWithAuth(API_URLS.SroSchedule, token, params);
  },
  async getSroItems(token: string, sroId: string, dateYYYYMMDD?: string) {
    const params: Record<string, string> = { sro_id: sroId };
    if (dateYYYYMMDD) params['date'] = dateYYYYMMDD;
    return fetchWithAuth(API_URLS.SROItem, token, params);
  },
  async searchHsCodes(token: string, query: string) { return fetchWithAuth(API_URLS.hsCodes, token, { q: query }); },
  async getHsUOM(token: string, hsCode: string, annexureId: number = 3) { return fetchWithAuth(API_URLS.hsUom, token, { hs_code: hsCode, annexure_id: String(annexureId) }); },
};