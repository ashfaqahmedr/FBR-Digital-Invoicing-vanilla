import React, { useMemo, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Product } from '../../types';

export function ProductsTable() {
  const { products, createProduct, updateProduct, deleteProduct } = useEntities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.hsCode.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', hsCode: '', unitPrice: 0, taxRate: 16, uom: '' });
    setIsOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateProduct(editing.id, form);
    } else {
      await createProduct(form);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm"/>
        <Button color="primary" onPress={openNew}>Add Product</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">HS Code</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Unit Price</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Tax Rate</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">UOM</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">{p.description}</div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{p.hsCode}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{p.unitPrice.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{p.taxRate}%</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{p.uom}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="flat" onPress={() => openEdit(p)}>Edit</Button>
                    <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(p.id)}>Delete</Button>
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
              <ModalHeader>{editing ? 'Edit Product' : 'Add Product'}</ModalHeader>
              <ModalBody>
                <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} isRequired/>
                <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="HS Code" value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} />
                  <Input type="number" label="Unit Price" value={String(form.unitPrice)} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" label="Tax Rate (%)" value={String(form.taxRate)} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) || 0 })} />
                  <Input label="UOM" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
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