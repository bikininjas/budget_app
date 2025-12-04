'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import {
  expensesApi,
  categoriesApi,
  accountsApi,
  usersApi,
  projectsApi,
} from '@/lib/api';
import { Expense, SplitType, Frequency } from '@/types';
import { SPLIT_TYPE_LABELS, FREQUENCY_LABELS } from '@/lib/utils';

const expenseSchema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Montant doit être positif'),
  date: z.string().min(1, 'Date requise'),
  category_id: z.coerce.number().min(1, 'Catégorie requise'),
  account_id: z.coerce.number().min(1, 'Compte requis'),
  assigned_to: z.coerce.number().min(1, 'Assignation requise'),
  split_type: z.nativeEnum(SplitType),
  frequency: z.nativeEnum(Frequency),
  project_id: z.coerce.number().optional().nullable(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  expense,
}: ExpenseFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!expense;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    enabled: isOpen,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(),
    enabled: isOpen,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: isOpen,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      label: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category_id: 0,
      account_id: 0,
      assigned_to: 0,
      split_type: SplitType.EQUAL,
      frequency: Frequency.ONE_TIME,
      project_id: null,
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        label: expense.label,
        description: expense.description || '',
        amount: Number(expense.amount),
        date: expense.date.split('T')[0],
        category_id: expense.category_id,
        account_id: expense.account_id,
        assigned_to: expense.assigned_to,
        split_type: expense.split_type,
        frequency: expense.frequency,
        project_id: expense.project_id,
      });
    } else {
      reset({
        label: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category_id: 0,
        account_id: 0,
        assigned_to: 0,
        split_type: SplitType.EQUAL,
        frequency: Frequency.ONE_TIME,
        project_id: null,
      });
    }
  }, [expense, reset]);

  const createExpense = useMutation({
    mutationFn: (data: ExpenseFormData) =>
      expensesApi.create({
        ...data,
        project_id: data.project_id || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
  });

  const updateExpense = useMutation({
    mutationFn: (data: ExpenseFormData) =>
      expensesApi.update(expense!.id, {
        ...data,
        project_id: data.project_id || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    if (isEditing) {
      updateExpense.mutate(data);
    } else {
      createExpense.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Libellé *
              </label>
              <input
                {...register('label')}
                className="input"
                placeholder="Ex: Courses Carrefour"
              />
              {errors.label && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.label.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Montant (€) *
              </label>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date *
              </label>
              <input
                {...register('date')}
                type="date"
                className="input"
              />
              {errors.date && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catégorie *
              </label>
              <select {...register('category_id')} className="input">
                <option value={0}>Sélectionner...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Compte bancaire *
              </label>
              <select {...register('account_id')} className="input">
                <option value={0}>Sélectionner...</option>
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.account_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assigné à *
              </label>
              <select {...register('assigned_to')} className="input">
                <option value={0}>Sélectionner...</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </option>
                ))}
              </select>
              {errors.assigned_to && (
                <p className="text-sm text-danger-500 mt-1">
                  {errors.assigned_to.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Répartition *
              </label>
              <select {...register('split_type')} className="input">
                {Object.entries(SPLIT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fréquence
              </label>
              <select {...register('frequency')} className="input">
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Projet
              </label>
              <select {...register('project_id')} className="input">
                <option value="">Aucun</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                className="input resize-none"
                rows={2}
                placeholder="Notes supplémentaires..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createExpense.isPending || updateExpense.isPending}
              className="btn-primary"
            >
              {createExpense.isPending || updateExpense.isPending
                ? 'Enregistrement...'
                : isEditing
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
