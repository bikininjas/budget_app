'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { expensesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const MONTH_NAMES = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

export function ExpenseChart() {
  const currentYear = new Date().getFullYear();

  const { data: monthlyStats } = useQuery({
    queryKey: ['monthly-stats', currentYear],
    queryFn: () => expensesApi.getMonthly(currentYear),
  });

  const chartData = MONTH_NAMES.map((name, index) => {
    const stats = monthlyStats?.find((m) => m.month === index + 1);
    return {
      name,
      total: stats ? Number(stats.total) : 0,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-slate-200 dark:stroke-slate-700" 
          />
          <XAxis 
            dataKey="name" 
            className="fill-slate-600 dark:fill-slate-400"
            tick={{ fontSize: 12 }} 
          />
          <YAxis
            className="fill-slate-600 dark:fill-slate-400"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k€`}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, white)',
              border: '1px solid var(--tooltip-border, #e2e8f0)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--tooltip-text, #1e293b)' }}
          />
          <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
