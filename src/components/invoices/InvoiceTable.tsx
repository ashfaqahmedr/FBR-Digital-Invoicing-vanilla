import React, { useMemo, useState } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { Input, Switch } from '@heroui/react';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { Invoice } from '../../types';

export function InvoiceTable() {
  const { invoices, loading, error, deleteInvoice } = useInvoices();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useInfinite, setUseInfinite] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(20);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return invoices.filter((inv) => {
      const matchesQ =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.buyerName.toLowerCase().includes(q) ||
        inv.sellerName.toLowerCase().includes(q);

      const matchesStatus = status === 'all' ? true : inv.status === status;

      const created = new Date(inv.createdAt);
      const matchesFrom = from ? created >= from : true;
      const matchesTo = to ? created <= to : true;

      return matchesQ && matchesStatus && matchesFrom && matchesTo;
    });
  }, [invoices, search, status, fromDate, toDate]);

  const paged = useMemo(() => {
    if (useInfinite) return filtered.slice(0, infiniteCount);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, useInfinite, infiniteCount]);

  const loadMore = () => setInfiniteCount((c) => c + 20);

  const columns: DataTableColumn<Invoice>[] = [
    { id: 'invoice', header: 'Invoice', cell: (i) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{i.invoiceNumber}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{i.sellerName}</div>
      </div>
    )},
    { id: 'buyer', header: 'Buyer', cell: (i) => <div className="text-sm text-gray-900 dark:text-white">{i.buyerName}</div> },
    { id: 'amount', header: 'Amount', cell: (i) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(i.totalAmount)}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Tax: {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(i.taxAmount)}</div>
      </div>
    )},
    { id: 'status', header: 'Status', cell: (i) => {
      const statusConfig = {
        draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        submitted: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
        approved: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
        rejected: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      } as const;
      const cls = statusConfig[i.status];
      return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>{i.status[0].toUpperCase() + i.status.slice(1)}</span>;
    }},
    { id: 'date', header: 'Date', cell: (i) => <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(i.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</div> },
    { id: 'actions', header: 'Actions', widthClassName: 'w-32', cell: (i) => (
      <div className="flex items-center justify-end space-x-2">
        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded" onClick={() => deleteInvoice(i.id)} title="Delete">Delete</button>
      </div>
    )},
  ];

  const filterBar = (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
      <Input placeholder="Search invoices" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <Input type="date" label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <Input type="date" label="To" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <div className="flex justify-end">
        <Switch size="sm" isSelected={useInfinite} onValueChange={setUseInfinite}>
          Infinite
        </Switch>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <ErrorAlert message={error} />
      </div>
    );
  }

  return (
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
  );
}