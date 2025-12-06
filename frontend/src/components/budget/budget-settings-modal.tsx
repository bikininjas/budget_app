'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Settings } from 'lucide-react';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

interface BudgetSettingsModalProps {
  user: User;
  onClose: () => void;
}

export function BudgetSettingsModal({ user, onClose }: BudgetSettingsModalProps) {
  const queryClient = useQueryClient();
  const [monthlyBudget, setMonthlyBudget] = useState(
    user.monthly_budget ? Number(user.monthly_budget) : 0
  );

  const updateMutation = useMutation({
    mutationFn: (data: { monthly_budget: number }) =>
      usersApi.update(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ monthly_budget: monthlyBudget });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Gestion du budget d&apos;Emeline
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
              Budget mensuel (€)
            </label>
            <input
              type="number"
              id="monthly_budget"
              name="monthly_budget"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="50.00"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ce budget sera renouvelé chaque mois pour Emeline.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Budget actuel : <strong className="text-slate-900 dark:text-white">{user.monthly_budget || 0}€</strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Nouveau budget : <strong className="text-primary-600 dark:text-primary-400">{monthlyBudget.toFixed(2)}€</strong>
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
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 
                       hover:bg-primary-700 rounded-lg transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {updateMutation.isError && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              Erreur lors de la mise à jour du budget
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
