'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Receipt, Calendar } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function DashboardStats() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['monthly-stats', currentYear],
    queryFn: () => expensesApi.getMonthly(currentYear),
  });

  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const thisMonthStats = monthlyStats?.find((m) => m.month === currentMonth);
  const lastMonthStats = monthlyStats?.find((m) => m.month === currentMonth - 1);

  const monthlyChange = lastMonthStats?.total
    ? ((Number(thisMonthStats?.total || 0) - Number(lastMonthStats.total)) /
        Number(lastMonthStats.total)) *
      100
    : 0;

  const stats = [
    {
      name: 'Total dépenses',
      value: formatCurrency(totalExpenses),
      icon: Receipt,
      change: null,
      color: 'bg-primary-500',
    },
    {
      name: 'Ce mois',
      value: formatCurrency(Number(thisMonthStats?.total || 0)),
      icon: Calendar,
      change: monthlyChange,
      color: 'bg-success-500',
    },
    {
      name: 'Nombre de dépenses',
      value: expenses?.length || 0,
      icon: Receipt,
      change: null,
      color: 'bg-warning-500',
    },
    {
      name: 'Ce mois',
      value: thisMonthStats?.count || 0,
      icon: Calendar,
      change: null,
      color: 'bg-danger-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{stat.name}</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white truncate">{stat.value}</p>
            </div>
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}
            >
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          {stat.change !== null && (
            <div className="mt-2 sm:mt-3 flex items-center gap-1 text-xs sm:text-sm">
              {stat.change >= 0 ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-danger-500" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-success-500" />
              )}
              <span
                className={stat.change >= 0 ? 'text-danger-500' : 'text-success-500'}
              >
                {Math.abs(stat.change).toFixed(1)}%
              </span>
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">vs mois dernier</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
