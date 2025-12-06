'use client';

import { useQuery } from '@tanstack/react-query';
import { Calculator, TrendingUp, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { recurringChargesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function PlannedBudget() {
  const { data, isLoading } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: () => recurringChargesApi.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Budget prévisionnel</h2>
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Budget prévisionnel</h2>
      
      {!data || data.charges.length === 0 ? (
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">Aucune charge fixe définie</p>
          <Link
            href="/budget"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Ajouter des charges fixes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Totaux */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-slate-600 dark:text-slate-300">Par mois</p>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.total_monthly)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-slate-600 dark:text-slate-300">Par an</p>
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.total_annual)}
              </p>
            </div>
          </div>

          {/* Top 5 charges */}
          <div className="space-y-2">
            {data.charges.slice(0, 5).map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{charge.category_icon || '📋'}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {charge.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                  {formatCurrency(charge.monthly_amount)}/mois
                </span>
              </div>
            ))}
          </div>

          {/* Lien vers la page complète */}
          <Link
            href="/budget"
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Gérer le budget
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
