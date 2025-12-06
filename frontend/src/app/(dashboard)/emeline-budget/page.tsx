'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline';
import { childExpensesApi } from '@/lib/api/child-expenses';
import { useAuth } from '@/contexts/auth-context';
import type { ChildExpense, ChildExpenseCreate } from '@/types';

export default function EmelineBudgetPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ChildExpense | null>(null);

  // Only allow child users to see their own budget, parents can see all
  const userId = user?.role === 'child' ? user.id : undefined;

  // Fetch budget summary
  const { data: summary } = useQuery({
    queryKey: ['child-expense-summary', userId, selectedMonth, selectedYear],
    queryFn: () =>
      childExpensesApi.getSummary({
        user_id: userId,
        month: selectedMonth,
        year: selectedYear,
      }),
  });

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['child-expenses', userId, selectedMonth, selectedYear],
    queryFn: () =>
      childExpensesApi.getAll({
        user_id: userId,
        month: selectedMonth,
        year: selectedYear,
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: childExpensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['child-expense-summary'] });
      setIsFormOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChildExpense> }) =>
      childExpensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['child-expense-summary'] });
      setEditingExpense(null);
      setIsFormOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: childExpensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['child-expense-summary'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<ChildExpense> & { user_id?: number } = {
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      purchase_date: formData.get('purchase_date') as string,
      product_url: formData.get('product_url') as string || null,
      notes: formData.get('notes') as string || null,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      data.user_id = userId || user!.id;
      createMutation.mutate(data as ChildExpenseCreate);
    }
  };

  // Check if user has access
  if (user?.role === 'child' && !summary) {
    return <div>Loading...</div>;
  }

  const remainingBudget = summary?.remaining_budget ?? 0;
  const budgetPercentage = summary?.monthly_budget
    ? ((summary.total_spent / summary.monthly_budget) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Budget Emeline
        </h1>
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="h-5 w-5" />
          Nouvelle dépense
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="flex gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <option key={month} value={month}>
              {format(new Date(2025, month - 1), 'MMMM', { locale: fr })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Budget Summary */}
      {summary && (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Résumé du budget
            </h2>
            <span className="text-sm text-gray-500">
              {summary.expense_count} dépense{summary.expense_count > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Budget mensuel</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.monthly_budget?.toFixed(2) ?? '0.00'} €
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dépensé</p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.total_spent.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Restant</p>
              <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {remainingBudget.toFixed(2)} €
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                budgetPercentage > 100 ? 'bg-red-600' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 text-right">
            {budgetPercentage.toFixed(1)}% utilisé
          </p>
        </div>
      )}

      {/* Expenses List */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dépenses</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Chargement...
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Aucune dépense pour ce mois
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </h3>
                      {expense.product_url && (
                        <a
                          href={expense.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {format(new Date(expense.purchase_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    {expense.notes && (
                      <p className="mt-1 text-sm text-gray-600">{expense.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {expense.amount.toFixed(2)} €
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsFormOpen(true);
                        }}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette dépense ?')) {
                            deleteMutation.mutate(expense.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsFormOpen(false)} />
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingExpense?.description}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Montant (€) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    defaultValue={editingExpense?.amount}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date d&apos;achat *
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    defaultValue={editingExpense?.purchase_date || format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lien du produit
                  </label>
                  <input
                    type="url"
                    name="product_url"
                    defaultValue={editingExpense?.product_url || ''}
                    placeholder="https://..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingExpense?.notes || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingExpense(null);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {editingExpense ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
