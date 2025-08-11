import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Seller } from '../../types';

export function SellersTable() {
  const { sellers, createSeller, updateSeller, deleteSeller } = useEntities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [form, setForm] = useState<Omit<Seller, 'id'>>({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sellers.filter(s =>
      s.name.toLowerCase().includes(q) || s.ntn.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [sellers, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', ntn: '', address: '', apiToken: '', environment: 'sandbox' });
    setIsOpen(true);
  };

  const openEdit = (s: Seller) => {
    setEditing(s);
    const { id, ...rest } = s;
    setForm(rest);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateSeller(editing.id, form);
    } else {
      await createSeller(form);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this seller?')) {
      await deleteSeller(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Search sellers" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
        <Button color="primary" onPress={openNew}>Add Seller</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">NTN</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Address</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Environment</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{s.name}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.ntn}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.address}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{s.environment}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="flat" onPress={() => openEdit(s)}>Edit</Button>
                    <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(s.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editing ? 'Edit Seller' : 'Add Seller'}</ModalHeader>
              <ModalBody>
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
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleSave}>{editing ? 'Update' : 'Create'}</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}