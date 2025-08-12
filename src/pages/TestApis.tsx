import React, { useState } from 'react';
import { Button, Input, Select, SelectItem, Textarea, Tabs, Tab } from '@heroui/react';
import { fbr } from '../services/fbr';

export function TestApis() {
  const [token, setToken] = useState('');
  const [hsQuery, setHsQuery] = useState('');
  const [saleType, setSaleType] = useState('Standard');
  const [sroId, setSroId] = useState('');
  const [result, setResult] = useState('');

  const call = async (fn: () => Promise<any>) => {
    try {
      const data = await fn();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">FBR Test APIs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input label="Bearer Token" value={token} onChange={(e) => setToken(e.target.value)} />
      </div>

      <Tabs aria-label="APIs" color="primary" variant="underlined" className="mb-4">
        <Tab key="provinces" title="Provinces">
          <Button color="primary" onPress={() => call(() => fbr.getProvinces(token))}>Load Provinces</Button>
        </Tab>
        <Tab key="uom" title="UOM">
          <Button color="primary" onPress={() => call(() => fbr.getUOM(token))}>Load UOM</Button>
        </Tab>
        <Tab key="sro" title="SRO Schedule">
          <div className="flex items-end gap-3">
            <Button color="primary" onPress={() => call(() => fbr.getSroSchedule(token))}>Load SRO Schedules</Button>
            <Input label="SRO Id" value={sroId} onChange={(e) => setSroId(e.target.value)} className="max-w-xs" />
            <Button onPress={() => call(() => fbr.getSroItems(token, sroId))}>Load SRO Items</Button>
          </div>
        </Tab>
        <Tab key="hs" title="HS Codes">
          <div className="flex items-end gap-3">
            <Input label="Search" value={hsQuery} onChange={(e) => setHsQuery(e.target.value)} className="max-w-xs" />
            <Button color="primary" onPress={() => call(() => fbr.searchHsCodes(token, hsQuery))}>Search</Button>
          </div>
        </Tab>
        <Tab key="rate" title="SaleTypeToRate">
          <div className="flex items-end gap-3">
            <Input label="Sale Type" value={saleType} onChange={(e) => setSaleType(e.target.value)} className="max-w-xs" />
            <Button color="primary" onPress={() => call(() => fbr.getSaleTypeToRate(token, saleType))}>Get Rate</Button>
          </div>
        </Tab>
      </Tabs>

      <Textarea minRows={16} value={result} readOnly label="Result" />
    </div>
  );
}