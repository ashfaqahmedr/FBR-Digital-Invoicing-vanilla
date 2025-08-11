import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useInvoiceContext } from './InvoiceContext';
import { fbr } from '../services/fbr';

interface ReferenceState {
  token: string | null;
  provinces: any[];
  uoms: any[];
  sroSchedules: any[];
  sroItemsBySchedule: Record<string, any[]>;
  setToken: (t: string | null) => void;
  refreshBasics: () => Promise<void>;
  searchHsCodes: (query: string) => Promise<any[]>;
  fetchHsUom: (hsCode: string) => Promise<any[]>;
  fetchSaleTypeToRate: (saleType: string, provinceId?: string) => Promise<any>;
  fetchSroItems: (sroId: string) => Promise<any[]>;
}

const ReferenceContext = createContext<ReferenceState | null>(null);

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const { state } = useInvoiceContext();
  const [token, setToken] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [sroSchedules, setSroSchedules] = useState<any[]>([]);
  const [sroItemsBySchedule, setSroItemsBySchedule] = useState<Record<string, any[]>>({});

  // Determine token from first seller
  useEffect(() => {
    if (state.sellers.length > 0) {
      const s = state.sellers[0] as any;
      const t = s.sandboxToken || s.apiToken || s.productionToken || null;
      setToken(t);
    }
  }, [state.sellers]);

  const refreshBasics = async () => {
    if (!token) return;
    try {
      const [prov, uom, sro] = await Promise.all([
        fbr.getProvinces(token),
        fbr.getUOM(token),
        fbr.getSroSchedule(token),
      ]);
      setProvinces(prov || []);
      setUoms(uom || []);
      setSroSchedules(sro || []);
    } catch (e) {
      // swallow
    }
  };

  useEffect(() => {
    refreshBasics();
  }, [token]);

  const value: ReferenceState = {
    token,
    provinces,
    uoms,
    sroSchedules,
    sroItemsBySchedule,
    setToken,
    refreshBasics,
    searchHsCodes: async (query: string) => {
      if (!token) return [];
      return fbr.searchHsCodes(token, query);
    },
    fetchHsUom: async (hsCode: string) => {
      if (!token) return [];
      // Not implemented in fbr.ts; keep placeholder, or extend service if endpoint available
      return [];
    },
    fetchSaleTypeToRate: async (saleType: string, provinceId?: string) => {
      if (!token) return null;
      return fbr.getSaleTypeToRate(token, saleType);
    },
    fetchSroItems: async (sroId: string) => {
      if (!token) return [];
      const items = await fbr.getSroItems(token, sroId);
      setSroItemsBySchedule((prev) => ({ ...prev, [sroId]: items || [] }));
      return items;
    },
  };

  return (
    <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>
  );
}

export function useReference() {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error('useReference must be used within ReferenceProvider');
  return ctx;
}