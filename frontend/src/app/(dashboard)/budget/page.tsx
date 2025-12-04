'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Wallet, TrendingUp } from 'lucide-react';
import { recurringChargesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RecurringCharge } from '@/types';
import { ChargeFormModal } from '@/components/budget/charge-form-modal';

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  annual: 'Annuel',
};

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [editingCharge, setEditingCharge] = useState<RecurringCharge | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: () => recurringChargesApi.getSummary(),
  });

  const deleteCharge = useMutation({
    mutationFn: (id: number) => recurringChargesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-charges'] });
    },
  });

  const handleDelete = (charge: RecurringCharge) => {
    if (confirm(`Supprimer "${charge.name}" du budget ?`)) {
      deleteCharge.mutate(charge.id);
    }
  };

  const handleEdit = (charge: RecurringCharge) => {
    setEditingCharge(charge);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCharge(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Budget Prévisionnel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Charges fixes et dépenses récurrentes à prévoir
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une charge
        </button>
      </div>

      {/* Résumé */}
      {summary && summary.charges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card dark:bg-slate-800 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Budget mensuel</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.total_monthly)}
                </p>
              </div>
            </div>
          </div>
          <div className="card dark:bg-slate-800 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Budget annuel</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.total_annual)}
                </p>
              </div>
            </div>
          </div>
          <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Par catégorie</p>
            <div className="flex flex-wrap gap-2">
              {summary.by_category.slice(0, 5).map((cat) => (
                <span
                  key={cat.category}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs"
                >
                  <span className="text-slate-600 dark:text-slate-300">{cat.category}:</span>
                  <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(cat.total)}/mois
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des charges */}
      <div className="card dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Charges fixes ({summary?.charges.length || 0})
          </h2>
        </div>

        {!summary || summary.charges.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Aucune charge définie
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Ajoutez vos charges fixes (loyer, assurances, abonnements...)
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une charge
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-medium">Charge</th>
                    <th className="p-4 font-medium">Catégorie</th>
                    <th className="p-4 font-medium">Fréquence</th>
                    <th className="p-4 font-medium text-right">Montant</th>
                    <th className="p-4 font-medium text-right">Par mois</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.charges.map((charge) => (
                    <tr
                      key={charge.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {charge.name}
                          </p>
                          {charge.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {charge.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${charge.category_color}20`,
                            color: charge.category_color || '#6B7280',
                          }}
                        >
                          {charge.category_icon} {charge.category_name}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {FREQUENCY_LABELS[charge.frequency]}
                      </td>
                      <td className="p-4 text-right text-sm text-slate-600 dark:text-slate-300">
                        {formatCurrency(charge.amount)}
                        {charge.frequency !== 'monthly' && (
                          <span className="text-xs text-slate-400">
                            /{charge.frequency === 'annual' ? 'an' : 'trim.'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(charge.monthly_amount)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(charge)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(charge)}
                            className="p-1.5 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
              {summary.charges.map((charge) => (
                <div key={charge.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {charge.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {FREQUENCY_LABELS[charge.frequency]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(charge.monthly_amount)}/mois
                      </p>
                      {charge.frequency !== 'monthly' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ({formatCurrency(charge.amount)}/{charge.frequency === 'annual' ? 'an' : 'trim.'})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${charge.category_color}20`,
                        color: charge.category_color || '#6B7280',
                      }}
                    >
                      {charge.category_icon} {charge.category_name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(charge)}
                        className="p-1.5 text-slate-400 hover:text-primary-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(charge)}
                        className="p-1.5 text-slate-400 hover:text-danger-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ChargeFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        charge={editingCharge}
      />
    </div>
  );
}
