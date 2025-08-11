import React from 'react';
import { DashboardCard } from './DashboardCard';
import { DashboardStats } from '../../types';
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface KPIGridProps {
  stats: DashboardStats;
}

export function KPIGrid({ stats }: KPIGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Total Invoices"
        value={stats.totalInvoices}
        icon={<DocumentTextIcon className="w-6 h-6 text-blue-600" />}
        trend={{ value: stats.monthlyGrowth, isPositive: true }}
      />
      
      <DashboardCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={<CurrencyDollarIcon className="w-6 h-6 text-green-600" />}
        trend={{ value: 8.2, isPositive: true }}
      />
      
      <DashboardCard
        title="Pending Invoices"
        value={stats.pendingInvoices}
        subtitle="Awaiting approval"
        icon={<ClockIcon className="w-6 h-6 text-yellow-600" />}
      />
      
      <DashboardCard
        title="Approved Invoices"
        value={stats.approvedInvoices}
        subtitle="Successfully processed"
        icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
      />
    </div>
  );
}