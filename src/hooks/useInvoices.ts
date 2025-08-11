import { useEffect } from 'react';
import { useInvoiceContext } from '../context/InvoiceContext';
import { api } from '../services/api';
import { Invoice } from '../types';

export function useInvoices() {
  const { state, dispatch } = useInvoiceContext();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const invoices = await api.getInvoices();
      dispatch({ type: 'SET_INVOICES', payload: invoices });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load invoices' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newInvoice = await api.createInvoice(invoiceData);
      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      return newInvoice;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create invoice' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedInvoice = await api.updateInvoice(id, updates);
      dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
      return updatedInvoice;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update invoice' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await api.deleteInvoice(id);
      dispatch({ type: 'DELETE_INVOICE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete invoice' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    invoices: state.invoices,
    loading: state.loading,
    error: state.error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refreshInvoices: loadInvoices,
  };
}