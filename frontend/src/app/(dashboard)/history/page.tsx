'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronUp, TrendingDown, TrendingUp, RefreshCcw } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { MonthlyHistory } from '@/types';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function MonthCard({ month, previousTotal }: { month: MonthlyHistory; previousTotal?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const monthName = MONTH_NAMES[month.month - 1];
  const trend = previousTotal !== undefined ? month.total - previousTotal : 0;
  const trendPercent = previousTotal && previousTotal > 0 
    ? ((month.total - previousTotal) / previousTotal * 100).toFixed(1)
    : null;

  return (
    <div className="card dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {monthName} {month.year}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {month.count} dépense{month.count > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(month.total)}
            </p>
            {previousTotal !== undefined && trend !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${
                trend > 0 ? 'text-danger-500' : 'text-success-500'
              }`}>
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {trend > 0 ? '+' : ''}{formatCurrency(trend)}
                  {trendPercent && ` (${trend > 0 ? '+' : ''}${trendPercent}%)`}
                </span>
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {/* Categories breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Par catégorie
            </h4>
            <div className="space-y-2">
              {month.categories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({cat.count})
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses list */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {month.expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: expense.category_color || '#6B7280' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {expense.label}
                      </p>
                      {expense.is_recurring && (
                        <RefreshCcw className="w-3 h-3 text-primary-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(expense.date).toLocaleDateString('fr-FR')} • {expense.category_name}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex-shrink-0 ml-2">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['expense-history'],
    queryFn: () => expensesApi.getMonthlyHistory(),
  });

  // Calculate yearly totals
  const yearlyTotals = history?.reduce((acc, month) => {
    if (!acc[month.year]) {
      acc[month.year] = 0;
    }
    acc[month.year] += month.total;
    return acc;
  }, {} as Record<number, number>) || {};

  const years = Object.keys(yearlyTotals).map(Number).sort((a, b) => b - a);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Historique des dépenses
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Vue mensuelle de toutes vos dépenses
        </p>
      </div>

      {/* Yearly summary cards */}
      {years.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {years.slice(0, 4).map((year) => (
            <div key={year} className="card dark:bg-slate-800 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{year}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(yearlyTotals[year])}
              </p>
              <p className="text-xs text-slate-400">
                {history?.filter(m => m.year === year).reduce((acc, m) => acc + m.count, 0)} dépenses
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly history */}
      {!history || history.length === 0 ? (
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Aucune dépense enregistrée
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Commencez par ajouter des dépenses pour voir l&apos;historique
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((month, index) => (
            <MonthCard
              key={`${month.year}-${month.month}`}
              month={month}
              previousTotal={history[index + 1]?.total}
            />
          ))}
        </div>
      )}
    </div>
  );
}
