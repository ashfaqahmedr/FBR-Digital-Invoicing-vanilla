import React, { useEffect, useMemo, useState } from 'react';
import { useInvoiceContext } from '../../context/InvoiceContext';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice, InvoiceItem } from '../../types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Input, Select, SelectItem, Autocomplete, AutocompleteItem } from '@heroui/react';
import { referenceData, HSCode, UOM, TaxRate, TransactionType } from '../../services/referenceData';

export function InvoiceForm() {
  const { state } = useInvoiceContext();
  const { createInvoice, loading } = useInvoices();
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    sellerId: '',
    buyerId: '',
    status: 'draft' as const,
    invoiceType: 'sale' as TransactionType['id'],
    invoiceDate: new Date().toISOString().slice(0, 10),
  });
  
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 16,
      hsCode: '',
      amount: 0,
    },
  ]);

  const [hsQuery, setHsQuery] = useState('');
  const [hsOptions, setHsOptions] = useState<HSCode[]>([]);
  const [uomOptions, setUomOptions] = useState<UOM[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [txnTypes, setTxnTypes] = useState<TransactionType[]>([]);

  useEffect(() => {
    referenceData.getUom().then(setUomOptions);
    referenceData.getTaxRates().then(setTaxRates);
    referenceData.getTransactionTypes().then(setTxnTypes);
  }, []);

  useEffect(() => {
    let active = true;
    referenceData.searchHsCodes(hsQuery).then((res) => { if (active) setHsOptions(res); });
    return () => { active = false; };
  }, [hsQuery]);

  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 16,
      hsCode: '',
      amount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value } as any;
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].amount = (updatedItems[index].quantity || 0) * (updatedItems[index].unitPrice || 0);
    }
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = items.reduce((sum, item) => sum + ((item.amount || 0) * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seller = state.sellers.find(s => s.id === formData.sellerId);
    const buyer = state.buyers.find(b => b.id === formData.buyerId);
    if (!seller || !buyer) { alert('Please select both seller and buyer'); return; }
    const { total, taxAmount } = calculateTotals();
    const invoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
      invoiceNumber: formData.invoiceNumber,
      sellerName: seller.name,
      buyerName: buyer.name,
      totalAmount: total,
      taxAmount,
      status: formData.status,
      items: items.map((item, index) => ({ ...item, id: (index + 1).toString() })),
    };
    await createInvoice(invoiceData);
    setFormData({ invoiceNumber: '', sellerId: '', buyerId: '', status: 'draft', invoiceType: 'sale', invoiceDate: new Date().toISOString().slice(0, 10) });
    setItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 16, hsCode: '', amount: 0 }]);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create New Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Invoice Number" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} isRequired />
          <Input type="date" label="Invoice Date" value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} />
          <Select label="Invoice Type" selectedKeys={new Set([formData.invoiceType])} onChange={(e) => setFormData({ ...formData, invoiceType: (e.target as HTMLSelectElement).value as any })}>
            {txnTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Seller" selectedKeys={new Set([formData.sellerId])} onChange={(e) => setFormData({ ...formData, sellerId: (e.target as HTMLSelectElement).value })}>
            {state.sellers.map((seller) => (
              <SelectItem key={seller.id} value={seller.id}>{seller.name} ({seller.ntn})</SelectItem>
            ))}
          </Select>
          <Select label="Buyer" selectedKeys={new Set([formData.buyerId])} onChange={(e) => setFormData({ ...formData, buyerId: (e.target as HTMLSelectElement).value })}>
            {state.buyers.map((buyer) => (
              <SelectItem key={buyer.id} value={buyer.id}>{buyer.name} ({buyer.ntn || buyer.cnic})</SelectItem>
            ))}
          </Select>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Items</h3>
            <Button type="button" onPress={addItem} color="primary" variant="solid" startContent={<PlusIcon className="w-4 h-4" />}>Add Item</Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="md:col-span-4">
                  <Autocomplete
                    label="HS Code"
                    defaultItems={hsOptions}
                    onInputChange={setHsQuery}
                    onSelectionChange={(key) => {
                      const selected = hsOptions.find(h => h.code === key);
                      updateItem(index, 'hsCode', selected?.code || String(key));
                      if (selected) updateItem(index, 'description', selected.description);
                    }}
                  >
                    {(itemOpt: HSCode) => (
                      <AutocompleteItem key={itemOpt.code} value={itemOpt.code}>
                        {itemOpt.code} - {itemOpt.description}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                </div>
                <div className="md:col-span-3">
                  <Input label="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} isRequired />
                </div>
                <div>
                  <Input type="number" label="Qty" min={1} value={String(item.quantity)} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <Input type="number" label="Unit Price" min={0} value={String(item.unitPrice)} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Select label="UOM">
                    {uomOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <Select label="Tax Rate" selectedKeys={new Set([String(item.taxRate)])} onChange={(e) => updateItem(index, 'taxRate', Number((e.target as HTMLSelectElement).value) || 0)}>
                    {taxRates.map((t) => (
                      <SelectItem key={String(t.rate)} value={String(t.rate)}>{t.saleType} - {t.rate}%</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-1 flex items-end">
                  {items.length > 1 && (
                    <Button type="button" onPress={() => removeItem(index)} variant="flat" color="danger">
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span><span className="font-medium text-gray-900 dark:text-white">PKR {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tax Amount:</span><span className="font-medium text-gray-900 dark:text-white">PKR {taxAmount.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-gray-900 dark:text-white">Total:</span><span className="text-gray-900 dark:text-white">PKR {total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isDisabled={loading} color="primary" variant="solid">{loading ? 'Creating...' : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}