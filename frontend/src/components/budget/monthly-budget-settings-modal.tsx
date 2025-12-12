'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Settings } from 'lucide-react';
import { childBudgetsApi } from '@/lib/api/child-budgets';
import type { User } from '@/types';

interface MonthlyBudgetSettingsModalProps {
  readonly user: User;
  readonly year: number;
  readonly month: number;
  readonly currentBudget: number | null;
  readonly onClose: () => void;
}

export function MonthlyBudgetSettingsModal({
  user,
  year,
  month,
  currentBudget,
  onClose,
}: MonthlyBudgetSettingsModalProps) {
  const queryClient = useQueryClient();
  const [monthlyBudget, setMonthlyBudget] = useState(
    currentBudget ? Number(currentBudget) : 40
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await childBudgetsApi.setBudget({
        user_id: user.id,
        year,
        month,
        budget_amount: monthlyBudget,
      });

      queryClient.invalidateQueries({ queryKey: ['child-expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['child-expenses'] });
      onClose();
    } catch (error) {
      console.error('Failed to update budget:', error);
      alert('Erreur lors de la mise à jour du budget');
    } finally {
      setIsLoading(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Budget pour {monthName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label
              htmlFor="monthly_budget"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Budget mensuel pour Emeline (€)
            </label>
            <input
              type="number"
              id="monthly_budget"
              name="monthly_budget"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number.parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="40.00"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Vous pouvez modifier le budget mois par mois si Emeline a droit à plus ou moins.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Budget pour <strong className="text-slate-900 dark:text-white">{monthName}</strong>
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {monthlyBudget.toFixed(2)}€
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 
                       hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white 
                       bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
