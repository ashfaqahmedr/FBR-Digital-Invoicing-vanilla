import React from 'react';
import { Tabs, Tab } from '@heroui/react';
import { SellersTable } from '../components/entities/SellersTable';
import { BuyersTable } from '../components/entities/BuyersTable';
import { ProductsTable } from '../components/entities/ProductsTable';

export function Entities() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Manage Entities</h2>
      <Tabs aria-label="Entities" color="primary" variant="underlined" className="mb-4">
        <Tab key="sellers" title="Sellers">
          <SellersTable />
        </Tab>
        <Tab key="buyers" title="Buyers">
          <BuyersTable />
        </Tab>
        <Tab key="products" title="Products">
          <ProductsTable />
        </Tab>
      </Tabs>
    </div>
  );
}