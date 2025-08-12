import { useEffect } from 'react';
import { useInvoiceContext } from '../context/InvoiceContext';
import { api } from '../services/api';
import { Seller, Buyer, Product } from '../types';

export function useEntities() {
  const { state, dispatch } = useInvoiceContext();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [sellers, buyers, products] = await Promise.all([
        api.getSellers(),
        api.getBuyers(),
        api.getProducts(),
      ]);
      dispatch({ type: 'SET_SELLERS', payload: sellers });
      dispatch({ type: 'SET_BUYERS', payload: buyers });
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load entities' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sellers
  const createSeller = async (seller: Omit<Seller, 'id'>) => {
    const created = await api.createSeller(seller);
    dispatch({ type: 'ADD_SELLER', payload: created });
    return created;
  };
  const updateSeller = async (id: string, updates: Partial<Seller>) => {
    const updated = await api.updateSeller(id, updates);
    dispatch({ type: 'SET_SELLERS', payload: state.sellers.map(s => s.id === id ? updated : s) });
    return updated;
  };
  const deleteSeller = async (id: string) => {
    await api.deleteSeller(id);
    dispatch({ type: 'SET_SELLERS', payload: state.sellers.filter(s => s.id !== id) });
  };

  // Buyers
  const createBuyer = async (buyer: Omit<Buyer, 'id'>) => {
    const created = await api.createBuyer(buyer);
    dispatch({ type: 'ADD_BUYER', payload: created });
    return created;
  };
  const updateBuyer = async (id: string, updates: Partial<Buyer>) => {
    const updated = await api.updateBuyer(id, updates);
    dispatch({ type: 'SET_BUYERS', payload: state.buyers.map(b => b.id === id ? updated : b) });
    return updated;
  };
  const deleteBuyer = async (id: string) => {
    await api.deleteBuyer(id);
    dispatch({ type: 'SET_BUYERS', payload: state.buyers.filter(b => b.id !== id) });
  };

  // Products
  const createProduct = async (product: Omit<Product, 'id'>) => {
    const created = await api.createProduct(product);
    dispatch({ type: 'ADD_PRODUCT', payload: created });
    return created;
  };
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await api.updateProduct(id, updates);
    dispatch({ type: 'SET_PRODUCTS', payload: state.products.map(p => p.id === id ? updated : p) });
    return updated;
  };
  const deleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    dispatch({ type: 'SET_PRODUCTS', payload: state.products.filter(p => p.id !== id) });
  };

  return {
    sellers: state.sellers,
    buyers: state.buyers,
    products: state.products,
    loading: state.loading,
    error: state.error,
    createSeller,
    updateSeller,
    deleteSeller,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    createProduct,
    updateProduct,
    deleteProduct,
    reload: loadAll,
  };
}