import React, { useEffect, useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Select, SelectItem, Switch } from '@heroui/react';
import { Product } from '../../types';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { ModalManager } from '../common/ModalManager';
import { referenceData, UOM, TaxRate } from '../../services/referenceData';

export function ProductsTable() {
  const { products, createProduct, updateProduct, deleteProduct } = useEntities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useInfinite, setUseInfinite] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(20);
  const [uomOptions, setUomOptions] = useState<UOM[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);

  useEffect(() => {
    referenceData.getUom().then(setUomOptions);
    referenceData.getTaxRates().then(setTaxRates);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.hsCode.toLowerCase().includes(q)
    );
  }, [products, search]);

  const paged = useMemo(() => {
    if (useInfinite) return filtered.slice(0, infiniteCount);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, useInfinite, infiniteCount]);

  const loadMore = () => setInfiniteCount((c) => c + 20);

  const columns: DataTableColumn<Product>[] = [
    { id: 'name', header: 'Name', cell: (p) => (
      <div className="text-gray-900 dark:text-white">
        <div className="font-medium">{p.name}</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs">{p.description}</div>
      </div>
    ) },
    { id: 'hs', header: 'HS Code', cell: (p) => <div className="text-gray-700 dark:text-gray-300">{p.hsCode}</div> },
    { id: 'price', header: 'Unit Price', cell: (p) => <div className="text-gray-700 dark:text-gray-300">{p.unitPrice.toLocaleString()}</div> },
    { id: 'tax', header: 'Tax Rate', cell: (p) => <div className="text-gray-700 dark:text-gray-300">{p.taxRate}%</div> },
    { id: 'uom', header: 'UOM', cell: (p) => <div className="text-gray-700 dark:text-gray-300">{p.uom}</div> },
    {
      id: 'actions', header: 'Actions', widthClassName: 'w-40', cell: (p) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="flat" onPress={() => openEdit(p)}>Edit</Button>
          <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(p.id)}>Delete</Button>
        </div>
      )
    },
  ];

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
      <Button color="primary" onPress={openNew}>Add Product</Button>
      <div className="flex items-center gap-2 ml-auto">
        <Switch size="sm" isSelected={useInfinite} onValueChange={setUseInfinite}>
          Infinite Scroll
        </Switch>
      </div>
    </div>
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '' });
    setIsOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setIsOpen(true);
  }

  async function handleSave() {
    if (editing) await updateProduct(editing.id, form);
    else await createProduct(form);
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this product?')) await deleteProduct(id);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={paged}
        totalCount={filtered.length}
        filterBar={filterBar}
        pagination={useInfinite ? undefined : { page, pageSize, onPageChange: setPage, onPageSizeChange: (n) => { setPageSize(n); setPage(1); } }}
        infiniteScroll={useInfinite}
        onLoadMore={useInfinite ? loadMore : undefined}
        hasMore={useInfinite ? paged.length < filtered.length : false}
      />

      <ModalManager
        isOpen={isOpen}
        title={editing ? 'Edit Product' : 'Add Product'}
        onClose={() => setIsOpen(false)}
        onConfirm={handleSave}
        confirmLabel={editing ? 'Update' : 'Create'}
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="HS Code" value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" label="Unit Price" value={String(form.unitPrice)} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })} />
            <Select label="UOM" selectedKeys={new Set([form.uom])} onChange={(e) => setForm({ ...form, uom: (e.target as HTMLSelectElement).value })}>
              {uomOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </Select>
          </div>
          <Select label="Tax Rate" selectedKeys={new Set([String(form.taxRate)])} onChange={(e) => setForm({ ...form, taxRate: Number((e.target as HTMLSelectElement).value) || 0 })}>
            {taxRates.map((t) => (
              <SelectItem key={String(t.rate)} value={String(t.rate)}>{t.saleType} - {t.rate}%</SelectItem>
            ))}
          </Select>
        </div>
      </ModalManager>
    </>
  );
}