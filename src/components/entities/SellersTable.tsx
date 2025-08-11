import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input } from '@heroui/react';
import { Seller } from '../../types';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { ModalManager } from '../common/ModalManager';

export function SellersTable() {
  const { sellers, createSeller, updateSeller, deleteSeller } = useEntities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [form, setForm] = useState<Omit<Seller, 'id'>>({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sellers.filter(s =>
      s.name.toLowerCase().includes(q) || s.ntn.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [sellers, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: DataTableColumn<Seller>[] = [
    { id: 'name', header: 'Name', cell: (s) => <div className="text-gray-900 dark:text-white">{s.name}</div> },
    { id: 'ntn', header: 'NTN', cell: (s) => <div className="text-gray-700 dark:text-gray-300">{s.ntn}</div> },
    { id: 'address', header: 'Address', cell: (s) => <div className="text-gray-700 dark:text-gray-300">{s.address}</div> },
    { id: 'env', header: 'Environment', cell: (s) => <div className="capitalize text-gray-700 dark:text-gray-300">{s.environment}</div> },
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
    <div className="flex items-center gap-3">
      <Input placeholder="Search sellers" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
      <Button color="primary" onPress={openNew}>Add Seller</Button>
    </div>
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox' });
    setIsOpen(true);
  }

  function openEdit(s: Seller) {
    setEditing(s);
    const { id, ...rest } = s;
    setForm(rest);
    setIsOpen(true);
  }

  async function handleSave() {
    if (editing) await updateSeller(editing.id, form);
    else await createSeller(form);
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this seller?')) await deleteSeller(id);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={paged}
        totalCount={filtered.length}
        filterBar={filterBar}
        pagination={{ page, pageSize, onPageChange: setPage, onPageSizeChange: (n) => { setPageSize(n); setPage(1); } }}
      />

      <ModalManager
        isOpen={isOpen}
        title={editing ? 'Edit Seller' : 'Add Seller'}
        onClose={() => setIsOpen(false)}
        onConfirm={handleSave}
        confirmLabel={editing ? 'Update' : 'Create'}
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
          <Input label="NTN" value={form.ntn} onChange={(e) => setForm({ ...form, ntn: e.target.value })} isRequired/>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="API Token" value={form.apiToken} onChange={(e) => setForm({ ...form, apiToken: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Environment</label>
            <select
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value as 'sandbox' | 'production' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
      </ModalManager>
    </>
  );
}