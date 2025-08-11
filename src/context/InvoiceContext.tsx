import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Invoice, Seller, Buyer, Product } from '../types';

interface InvoiceState {
  invoices: Invoice[];
  sellers: Seller[];
  buyers: Buyer[];
  products: Product[];
  currentSeller: Seller | null;
  loading: boolean;
  error: string | null;
}

type InvoiceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_SELLERS'; payload: Seller[] }
  | { type: 'ADD_SELLER'; payload: Seller }
  | { type: 'SET_BUYERS'; payload: Buyer[] }
  | { type: 'ADD_BUYER'; payload: Buyer }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'SET_CURRENT_SELLER'; payload: Seller | null };

const initialState: InvoiceState = {
  invoices: [],
  sellers: [],
  buyers: [],
  products: [],
  currentSeller: null,
  loading: false,
  error: null,
};

function invoiceReducer(state: InvoiceState, action: InvoiceAction): InvoiceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.payload.id ? action.payload : inv
        ),
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(inv => inv.id !== action.payload),
      };
    case 'SET_SELLERS':
      return { ...state, sellers: action.payload };
    case 'ADD_SELLER':
      return { ...state, sellers: [...state.sellers, action.payload] };
    case 'SET_BUYERS':
      return { ...state, buyers: action.payload };
    case 'ADD_BUYER':
      return { ...state, buyers: [...state.buyers, action.payload] };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'SET_CURRENT_SELLER':
      return { ...state, currentSeller: action.payload };
    default:
      return state;
  }
}

const InvoiceContext = createContext<{
  state: InvoiceState;
  dispatch: React.Dispatch<InvoiceAction>;
} | null>(null);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);

  return (
    <InvoiceContext.Provider value={{ state, dispatch }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoiceContext() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
}