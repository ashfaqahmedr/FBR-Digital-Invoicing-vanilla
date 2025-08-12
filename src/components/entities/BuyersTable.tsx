import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Switch } from '@heroui/react';
import { Buyer } from '../../types';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { ModalManager } from '../common/ModalManager';

export function BuyersTable() {
  const { buyers, createBuyer, updateBuyer, deleteBuyer } = useEntities();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [form, setForm] = useState<Omit<Buyer, 'id'>>({ name: '', ntn: '', cnic: '', address: '', registrationStatus: 'registered' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useInfinite, setUseInfinite] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(20);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return buyers.filter(b => {
      const matchesQ = b.name.toLowerCase().includes(q) || (b.ntn || '').toLowerCase().includes(q) || (b.cnic || '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' ? true : b.registrationStatus === status;
      return matchesQ && matchesStatus;
    });
  }, [buyers, search, status]);

  const paged = useMemo(() => {
    if (useInfinite) return filtered.slice(0, infiniteCount);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, useInfinite, infiniteCount]);

  const loadMore = () => setInfiniteCount((c) => c + 20);

  const columns: DataTableColumn<Buyer>[] = [
    { id: 'name', header: 'Name', cell: (b) => <div className="text-gray-900 dark:text-white">{b.name}</div> },
    { id: 'idcol', header: 'NTN/CNIC', cell: (b) => <div className="text-gray-700 dark:text-gray-300">{b.ntn || b.cnic}</div> },
    { id: 'address', header: 'Address', cell: (b) => <div className="text-gray-700 dark:text-gray-300">{b.address}</div> },
    { id: 'status', header: 'Status', cell: (b) => <div className="capitalize text-gray-700 dark:text-gray-300">{b.registrationStatus}</div> },
    {
      id: 'actions', header: 'Actions', widthClassName: 'w-40', cell: (b) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="flat" onPress={() => openEdit(b)}>Edit</Button>
          <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(b.id)}>Delete</Button>
        </div>
      )
    },
  ];

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <Input placeholder="Search buyers" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
      <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
        <option value="all">All Status</option>
        <option value="registered">Registered</option>
        <option value="unregistered">Unregistered</option>
      </select>
      <Button color="primary" onPress={openNew}>Add Buyer</Button>
      <div className="flex items-center gap-2 ml-auto">
        <Switch size="sm" isSelected={useInfinite} onValueChange={setUseInfinite}>
          Infinite Scroll
        </Switch>
      </div>
    </div>
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', ntn: '', cnic: '', address: '', registrationStatus: 'registered' });
    setIsOpen(true);
  }

  function openEdit(b: Buyer) {
    setEditing(b);
    const { id, ...rest } = b;
    setForm(rest);
    setIsOpen(true);
  }

  async function handleSave() {
    if (editing) await updateBuyer(editing.id, form);
    else await createBuyer(form);
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this buyer?')) await deleteBuyer(id);
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
        title={editing ? 'Edit Buyer' : 'Add Buyer'}
        onClose={() => setIsOpen(false)}
        onConfirm={handleSave}
        confirmLabel={editing ? 'Update' : 'Create'}
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="NTN" value={form.ntn || ''} onChange={(e) => setForm({ ...form, ntn: e.target.value })} />
            <Input label="CNIC" value={form.cnic || ''} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Registration Status</label>
            <select
              value={form.registrationStatus}
              onChange={(e) => setForm({ ...form, registrationStatus: e.target.value as 'registered' | 'unregistered' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="registered">Registered</option>
              <option value="unregistered">Unregistered</option>
            </select>
          </div>
        </div>
      </ModalManager>
    </>
  );
}