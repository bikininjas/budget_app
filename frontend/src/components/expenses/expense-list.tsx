'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Receipt, RefreshCcw } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import { Expense } from '@/types';
import { formatCurrency, formatDateShort, SPLIT_TYPE_LABELS } from '@/lib/utils';
import { ExpenseFilters, type ExpenseFiltersType } from './expense-filters';
import { ExpenseFormModal } from './expense-form-modal';

const PAGE_SIZE = 20;

export function ExpenseList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ExpenseFiltersType>({});
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () =>
      expensesApi.getAll({
        category_id: filters.category_id,
        account_id: filters.account_id,
        assigned_to: filters.assigned_to_id,
        project_id: filters.project_id,
        start_date: filters.start_date,
        end_date: filters.end_date,
      }),
  });

  const deleteExpense = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleDelete = (expense: Expense) => {
    if (confirm(`Supprimer la dépense "${expense.label}" ?`)) {
      deleteExpense.mutate(expense.id);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  // Pagination
  const totalPages = Math.ceil(expenses.length / PAGE_SIZE);
  const paginatedExpenses = expenses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalAmount = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="space-y-4">
      <ExpenseFilters filters={filters} onChange={setFilters} />

      <div className="card dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {expenses.length} dépense{expenses.length !== 1 ? 's' : ''} -{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Total: {formatCurrency(totalAmount)}
            </span>
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary text-sm w-full sm:w-auto"
          >
            + Nouvelle dépense
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">Chargement...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Aucune dépense
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Aucune dépense ne correspond à vos critères.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Libellé</th>
                    <th className="p-4 font-medium">Catégorie</th>
                    <th className="p-4 font-medium">Compte</th>
                    <th className="p-4 font-medium">Assigné à</th>
                    <th className="p-4 font-medium">Répartition</th>
                    <th className="p-4 font-medium text-right">Montant</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDateShort(expense.date)}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                            {expense.is_recurring && (
                              <span title="Dépense récurrente">
                                <RefreshCcw className="w-3.5 h-3.5 text-primary-500" />
                              </span>
                            )}
                            {expense.label}
                          </p>
                          {expense.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {expense.description}
                            </p>
                          )}
                          {expense.project_name && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              📁 {expense.project_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${expense.category_color}20`,
                            color: expense.category_color,
                          }}
                        >
                          {expense.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {expense.account_name || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            expense.assigned_user_name?.toLowerCase() === 'seb'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                          }`}
                        >
                          {expense.assigned_user_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {SPLIT_TYPE_LABELS[expense.split_type] || expense.split_type}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(Number(expense.amount))}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-1.5 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                            disabled={deleteExpense.isPending}
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

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedExpenses.map((expense) => (
                <div key={expense.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {expense.is_recurring && (
                          <RefreshCcw className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                        )}
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
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${expense.category_color}20`,
                        color: expense.category_color,
                      }}
                    >
                      {expense.category_name || 'N/A'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        expense.assigned_user_name?.toLowerCase() === 'seb'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                      }`}
                    >
                      {expense.assigned_user_name || 'N/A'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {SPLIT_TYPE_LABELS[expense.split_type] || expense.split_type}
                    </span>
                    {expense.project_name && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                        📁 {expense.project_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{expense.account_name || 'N/A'}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-1.5 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400"
                        disabled={deleteExpense.isPending}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        expense={editingExpense}
      />
    </div>
  );
}
