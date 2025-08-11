import { useState, useEffect } from 'react';
import { useInvoiceContext } from '../context/InvoiceContext';
import { DashboardStats, ChartData } from '../types';

export function useDashboardData() {
  const { state } = useInvoiceContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateDashboardData();
  }, [state.invoices]);

  const calculateDashboardData = () => {
    setLoading(true);
    
    const { invoices } = state;
    
    // Calculate basic stats
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'submitted').length;
    const approvedInvoices = invoices.filter(inv => inv.status === 'approved').length;
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    
    // Mock monthly growth calculation
    const monthlyGrowth = 12.5;

    const dashboardStats: DashboardStats = {
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      approvedInvoices,
      monthlyGrowth,
      averageInvoiceValue,
    };

    // Generate monthly data for charts
    const monthlyChartData: ChartData[] = [
      { name: 'Jan', revenue: 45000, invoices: 12 },
      { name: 'Feb', revenue: 52000, invoices: 15 },
      { name: 'Mar', revenue: 48000, invoices: 13 },
      { name: 'Apr', revenue: 61000, invoices: 18 },
      { name: 'May', revenue: 55000, invoices: 16 },
      { name: 'Jun', revenue: 67000, invoices: 20 },
    ];

    // Generate status distribution data
    const statusChartData: ChartData[] = [
      { name: 'Approved', value: approvedInvoices },
      { name: 'Submitted', value: pendingInvoices },
      { name: 'Draft', value: invoices.filter(inv => inv.status === 'draft').length },
      { name: 'Rejected', value: invoices.filter(inv => inv.status === 'rejected').length },
    ];

    setStats(dashboardStats);
    setMonthlyData(monthlyChartData);
    setStatusData(statusChartData);
    setLoading(false);
  };

  return {
    stats,
    monthlyData,
    statusData,
    loading,
  };
}