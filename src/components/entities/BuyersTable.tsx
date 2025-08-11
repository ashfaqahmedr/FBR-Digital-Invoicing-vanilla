import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Buyer } from '../../types';

export function BuyersTable() {
  const { buyers, createBuyer, updateBuyer, deleteBuyer } = useEntities();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [form, setForm] = useState<Omit<Buyer, 'id'>>({ name: '', ntn: '', cnic: '', address: '', registrationStatus: 'registered' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return buyers.filter(b => {
      const matchesQ = b.name.toLowerCase().includes(q) || (b.ntn || '').toLowerCase().includes(q) || (b.cnic || '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' ? true : b.registrationStatus === status;
      return matchesQ && matchesStatus;
    });
  }, [buyers, search, status]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', ntn: '', cnic: '', address: '', registrationStatus: 'registered' });
    setIsOpen(true);
  };

  const openEdit = (b: Buyer) => {
    setEditing(b);
    const { id, ...rest } = b;
    setForm(rest);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateBuyer(editing.id, form);
    } else {
      await createBuyer(form);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this buyer?')) {
      await deleteBuyer(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Search buyers" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
          <option value="all">All Status</option>
          <option value="registered">Registered</option>
          <option value="unregistered">Unregistered</option>
        </select>
        <Button color="primary" onPress={openNew}>Add Buyer</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">NTN/CNIC</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Address</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{b.name}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{b.ntn || b.cnic}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{b.address}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{b.registrationStatus}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="flat" onPress={() => openEdit(b)}>Edit</Button>
                    <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(b.id)}>Delete</Button>
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
              <ModalHeader>{editing ? 'Edit Buyer' : 'Add Buyer'}</ModalHeader>
              <ModalBody>
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