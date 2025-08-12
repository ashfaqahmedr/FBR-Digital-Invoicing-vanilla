import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Switch, Chip } from '@heroui/react';
import { Seller } from '../../types';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { ModalManager } from '../common/ModalManager';

// Minimal scenario suggester based on activity/sector; real list can be imported from a data file
const scenariosByActivitySector: Record<string, string[]> = {
  'Manufacturer|All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006'],
  'Retailer|All Other Sectors': ['SN026', 'SN027', 'SN028', 'SN008'],
};

export function SellersTable() {
  const { sellers, createSeller, updateSeller, deleteSeller } = useEntities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [form, setForm] = useState<Omit<Seller, 'id'>>({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox', businessActivity: '', businessName: '' } as any);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useInfinite, setUseInfinite] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(20);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sellers.filter(s => s.name.toLowerCase().includes(q) || s.ntn.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }, [sellers, search]);

  const paged = useMemo(() => {
    if (useInfinite) return filtered.slice(0, infiniteCount);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, useInfinite, infiniteCount]);

  const loadMore = () => setInfiniteCount((c) => c + 20);

  const columns: DataTableColumn<Seller>[] = [
    { id: 'name', header: 'Name', cell: (s) => <div className="text-gray-900 dark:text-white">{s.name}</div> },
    { id: 'ntn', header: 'NTN', cell: (s) => <div className="text-gray-700 dark:text-gray-300">{s.ntn}</div> },
    { id: 'address', header: 'Address', cell: (s) => <div className="text-gray-700 dark:text-gray-300">{s.address}</div> },
    { id: 'env', header: 'Environment', cell: (s) => <div className="capitalize text-gray-700 dark:text-gray-300">{s.environment}</div> },
    { id: 'activity', header: 'Activity', cell: (s) => <div className="text-gray-700 dark:text-gray-300">{s.businessActivity || '-'}</div> },
    {
      id: 'actions', header: 'Actions', widthClassName: 'w-40', cell: (s) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="flat" onPress={() => openEdit(s)}>Edit</Button>
          <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(s.id)}>Delete</Button>
        </div>
      )
    },
  ];

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <Input placeholder="Search sellers" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
      <Button color="primary" onPress={openNew}>Add Seller</Button>
      <div className="flex items-center gap-2 ml-auto">
        <Switch size="sm" isSelected={useInfinite} onValueChange={setUseInfinite}>Infinite Scroll</Switch>
      </div>
    </div>
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox', businessActivity: '', businessName: '' } as any);
    setIsOpen(true);
  }

  function openEdit(s: Seller) {
    setEditing(s);
    const { id, ...rest } = s as any;
    setForm(rest);
    setIsOpen(true);
  }

  async function handleSave() {
    if (editing) await updateSeller(editing.id, form as any);
    else await createSeller(form as any);
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this seller?')) await deleteSeller(id);
  }

  const scenarioKey = `${(form as any).businessActivity || ''}|${(form as any).sector || 'All Other Sectors'}`;
  const suggested = scenariosByActivitySector[scenarioKey] || [];

  return (
    <>
      <DataTable columns={columns} data={paged} totalCount={filtered.length} filterBar={filterBar} pagination={useInfinite ? undefined : { page, pageSize, onPageChange: setPage, onPageSizeChange: (n) => { setPageSize(n); setPage(1); } }} infiniteScroll={useInfinite} onLoadMore={useInfinite ? loadMore : undefined} hasMore={useInfinite ? paged.length < filtered.length : false} />

      <ModalManager isOpen={isOpen} title={editing ? 'Edit Seller' : 'Add Seller'} onClose={() => setIsOpen(false)} onConfirm={handleSave} confirmLabel={editing ? 'Update' : 'Create'}>
        <div className="space-y-3">
          <Input label="Business Name" value={(form as any).businessName || ''} onChange={(e) => setForm({ ...(form as any), businessName: e.target.value } as any)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
            <Input label="NTN" value={form.ntn} onChange={(e) => setForm({ ...form, ntn: e.target.value })} isRequired/>
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Business Activity" value={(form as any).businessActivity || ''} onChange={(e) => setForm({ ...(form as any), businessActivity: e.target.value } as any)} />
            <Input label="Sector" value={(form as any).sector || ''} onChange={(e) => setForm({ ...(form as any), sector: e.target.value } as any)} />
          </div>
          {suggested.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggested.map((sc) => (<Chip key={sc} size="sm" color="primary" variant="flat">{sc}</Chip>))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sandbox Token" value={(form as any).sandboxToken || ''} onChange={(e) => setForm({ ...(form as any), sandboxToken: e.target.value } as any)} />
            <Input label="Production Token" value={(form as any).productionToken || ''} onChange={(e) => setForm({ ...(form as any), productionToken: e.target.value } as any)} />
          </div>
        </div>
      </ModalManager>
    </>
  );
}