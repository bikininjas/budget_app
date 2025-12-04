'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { expensesApi } from '@/lib/api';
import { formatCurrency, FREQUENCY_LABELS } from '@/lib/utils';
import { Frequency } from '@/types';

export function RecurringBudget() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['recurring-budget'],
    queryFn: () => expensesApi.getRecurringBudget(),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <RefreshCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Aucune dépense récurrente</p>
        <p className="text-sm mt-1">Marquez des dépenses comme récurrentes pour les voir ici</p>
      </div>
    );
  }

  const displayedItems = isExpanded ? data.items : data.items.slice(0, 5);
  const annualTotal = data.total_monthly * 12;

  return (
    <div className="space-y-4">
      {/* Totaux mensuels et annuels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-500/20 dark:to-primary-600/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <p className="text-xs text-slate-600 dark:text-slate-400">Par mois</p>
          </div>
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(data.total_monthly)}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCcw className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-slate-600 dark:text-slate-400">Par an</p>
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(annualTotal)}
          </p>
        </div>
      </div>

      {/* Répartition par catégorie */}
      {data.by_category && data.by_category.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Par catégorie
          </p>
          <div className="flex flex-wrap gap-2">
            {data.by_category.slice(0, 4).map((cat) => (
              <div
                key={cat.category}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs"
              >
                <span className="text-slate-600 dark:text-slate-300">{cat.category}</span>
                <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(cat.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détail des dépenses */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {data.items.length} dépense{data.items.length > 1 ? 's' : ''} récurrente{data.items.length > 1 ? 's' : ''}
        </p>
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <RefreshCcw className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.category_name} • {FREQUENCY_LABELS[item.frequency as Frequency] || item.frequency}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(item.monthly_amount)}
                <span className="text-xs text-slate-500 dark:text-slate-400">/mois</span>
              </p>
              {item.frequency !== 'monthly' && item.frequency !== 'one_time' && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ({formatCurrency(item.amount)} {item.frequency === 'annual' ? '/an' : item.frequency === 'quarterly' ? '/trim.' : ''})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton voir plus/moins */}
      {data.items.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Voir les {data.items.length - 5} autres
            </>
          )}
        </button>
      )}
    </div>
  );
}
