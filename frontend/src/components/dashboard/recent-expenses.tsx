'use client';

import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDateShort, getExpenseSplitDescription } from '@/lib/utils';

export function RecentExpenses() {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500">
        Chargement...
      </div>
    );
  }

  const recentExpenses = expenses?.slice(0, 5) || [];

  if (recentExpenses.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500">
        Aucune dépense récente
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Libellé</th>
              <th className="pb-3 font-medium">Catégorie</th>
              <th className="pb-3 font-medium">Assigné à</th>
              <th className="pb-3 font-medium">Répartition</th>
              <th className="pb-3 font-medium text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {recentExpenses.map((expense) => (
              <tr
                key={expense.id}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <td className="py-3 text-slate-500 dark:text-slate-400">
                  {formatDateShort(expense.date)}
                </td>
                <td className="py-3 font-medium text-slate-900 dark:text-white">{expense.label}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                    {expense.category_name || 'N/A'}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded ${
                      expense.assigned_user_name?.toLowerCase() === 'seb'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                    }`}
                  >
                    {expense.assigned_user_name || 'N/A'}
                  </span>
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300">
                  {getExpenseSplitDescription(
                    expense.split_type,
                    expense.assigned_user_name || '',
                    Number(expense.amount)
                  )}
                </td>
                <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(Number(expense.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-700">
        {recentExpenses.map((expense) => (
          <div key={expense.id} className="py-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {expense.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDateShort(expense.date)}
                </p>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white ml-2">
                {formatCurrency(Number(expense.amount))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
                {expense.category_name || 'N/A'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  expense.assigned_user_name?.toLowerCase() === 'seb'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                }`}
              >
                {expense.assigned_user_name || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
