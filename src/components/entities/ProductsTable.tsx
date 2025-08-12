import React, { useEffect, useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Select, SelectItem, Switch, Autocomplete, AutocompleteItem } from '@heroui/react';
import { Product } from '../../types';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { ModalManager } from '../common/ModalManager';
import { referenceData, UOM, TaxRate } from '../../services/referenceData';
import { useReference } from '../../context/ReferenceContext';
import { fbr } from '../../services/fbr';

export function ProductsTable() {
  const { products, createProduct, updateProduct, deleteProduct } = useEntities();
  const ref = useReference();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '', province: '', saleType: '', sroId: '', sroItemId: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useInfinite, setUseInfinite] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(20);
  const [uomOptions, setUomOptions] = useState<UOM[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [hsQuery, setHsQuery] = useState('');
  const [hsOptions, setHsOptions] = useState<{ code: string; description: string }[]>([]);
  const [sroItems, setSroItems] = useState<any[]>([]);

  useEffect(() => {
    if (ref.token) {
      setUomOptions(ref.uoms);
    } else {
      referenceData.getUom().then(setUomOptions);
    }
    referenceData.getTaxRates().then(setTaxRates);
  }, [ref.token, ref.uoms]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!hsQuery) { setHsOptions([]); return; }
      if (ref.token) {
        const res = await ref.searchHsCodes(hsQuery);
        if (active) setHsOptions((res as any[]).map((r: any) => ({ code: r.code || r.hsCode || r.HSCode || '', description: r.description || r.desc || '' })));
      } else {
        const res = await referenceData.searchHsCodes(hsQuery);
        if (active) setHsOptions(res);
      }
    }
    run();
    return () => { active = false; };
  }, [hsQuery, ref.token]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.hsCode.toLowerCase().includes(q));
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
    { id: 'prov', header: 'Province', cell: (p) => <div className="text-gray-700 dark:text-gray-300">{p.province || '-'}</div> },
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
        <Switch size="sm" isSelected={useInfinite} onValueChange={setUseInfinite}>Infinite Scroll</Switch>
      </div>
    </div>
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '', province: '', saleType: '', sroId: '', sroItemId: '' });
    setSroItems([]);
    setIsOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setSroItems([]);
    setIsOpen(true);
  }

  async function handleSave() {
    if (editing) await updateProduct(editing.id, form);
    else await createProduct(form);
    setIsOpen(false);
  }

  async function handleDelete(id: string) { if (confirm('Delete this product?')) await deleteProduct(id); }

  // Chaining: HS -> HS_UOM
  async function onHsSelected(code: string) {
    setForm({ ...form, hsCode: code });
    try {
      if (ref.token) {
        const res = await fbr.getHsUOM(ref.token, code, 3);
        const uom = Array.isArray(res) && res[0]?.uom ? res[0].uom : (res[0]?.UOM || '');
        if (uom) setForm((f) => ({ ...f, uom }));
      }
    } catch {}
  }

  // Chaining: SaleType -> SaleTypeToRate (province)
  async function onSaleTypeChanged(saleType: string) {
    setForm((f) => ({ ...f, saleType }));
    try {
      if (ref.token) {
        const rateRes = await fbr.getSaleTypeToRate(ref.token, saleType);
        const rate = Array.isArray(rateRes) ? (rateRes[0]?.rate || rateRes[0]?.Rate || 0) : (rateRes?.rate || 0);
        if (rate !== undefined) setForm((f) => ({ ...f, taxRate: Number(rate) }));
        const today = new Date();
        const dateDDMonYYYY = fbr.formatDateDDMonYYYY(today);
        const provinceCsv = (form.province || '').toString();
        const sroSched = await fbr.getSroSchedule(ref.token, String(rate), dateDDMonYYYY, provinceCsv);
        // expect array
        const first = Array.isArray(sroSched) ? sroSched[0] : null;
        if (first?.id) setForm((f) => ({ ...f, sroId: String(first.id) }));
        if (first?.id) {
          const sroItemsRes = await fbr.getSroItems(ref.token, String(first.id), fbr.formatDateYYYYMMDD(today));
          setSroItems(Array.isArray(sroItemsRes) ? sroItemsRes : []);
        }
      }
    } catch {}
  }

  // Chaining: SRO selection -> SRO items fetch
  async function onSroChanged(sroId: string) {
    setForm((f) => ({ ...f, sroId }));
    try {
      if (ref.token) {
        const today = new Date();
        const res = await fbr.getSroItems(ref.token, sroId, fbr.formatDateYYYYMMDD(today));
        setSroItems(Array.isArray(res) ? res : []);
      }
    } catch {}
  }

  return (
    <>
      <DataTable columns={columns} data={paged} totalCount={filtered.length} filterBar={filterBar} pagination={useInfinite ? undefined : { page, pageSize, onPageChange: setPage, onPageSizeChange: (n) => { setPageSize(n); setPage(1); } }} infiniteScroll={useInfinite} onLoadMore={useInfinite ? loadMore : undefined} hasMore={useInfinite ? paged.length < filtered.length : false} />

      <ModalManager isOpen={isOpen} title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setIsOpen(false)} onConfirm={handleSave} confirmLabel={editing ? 'Update' : 'Create'}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Autocomplete label="HS Code" defaultItems={hsOptions} onInputChange={setHsQuery} onSelectionChange={(key) => onHsSelected(String(key))}>
              {(opt: any) => (<AutocompleteItem key={opt.code} value={opt.code}>{opt.code} - {opt.description}</AutocompleteItem>)}
            </Autocomplete>
            <Input type="number" label="Unit Price" value={String(form.unitPrice)} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="UOM" selectedKeys={new Set([form.uom || ''])} onChange={(e) => setForm({ ...form, uom: (e.target as HTMLSelectElement).value })}>
              {uomOptions.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
            </Select>
            <Select label="Province" selectedKeys={new Set([form.province || ''])} onChange={(e) => setForm({ ...form, province: (e.target as HTMLSelectElement).value })}>
              {ref.provinces.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.name || p.description || p.id}</SelectItem>))}
            </Select>
            <Input label="Sale Type" value={form.saleType || ''} onChange={(e) => onSaleTypeChanged(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" label="Tax Rate (%)" value={String(form.taxRate)} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) || 0 })} />
            <Select label="SRO Schedule" selectedKeys={new Set([form.sroId || ''])} onChange={(e) => onSroChanged((e.target as HTMLSelectElement).value)}>
              {ref.sroSchedules.map((s: any) => (<SelectItem key={String(s.id || s.SRO_ID)} value={String(s.id || s.SRO_ID)}>{s.title || s.Description || s.Name || String(s.id)}</SelectItem>))}
            </Select>
          </div>
          <Select label="SRO Item" selectedKeys={new Set([form.sroItemId || ''])} onChange={(e) => setForm({ ...form, sroItemId: (e.target as HTMLSelectElement).value })}>
            {sroItems.map((it: any) => (<SelectItem key={String(it.id || it.ItemId)} value={String(it.id || it.ItemId)}>{it.title || it.Description || it.ItemName || String(it.id)}</SelectItem>))}
          </Select>
        </div>
      </ModalManager>
    </>
  );
}