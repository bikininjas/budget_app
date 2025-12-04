'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { recurringChargesApi, categoriesApi } from '@/lib/api';
import { RecurringCharge, ChargeFrequency } from '@/types';

const FREQUENCY_OPTIONS: { value: ChargeFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'annual', label: 'Annuel' },
];

const chargeSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Montant doit être positif'),
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
  category_id: z.coerce.number().min(1, 'Catégorie requise'),
});

type ChargeFormData = z.infer<typeof chargeSchema>;

interface ChargeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  charge?: RecurringCharge | null;
}

export function ChargeFormModal({ isOpen, onClose, charge }: ChargeFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!charge;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChargeFormData>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      frequency: 'monthly',
      category_id: 0,
    },
  });

  useEffect(() => {
    if (charge) {
      reset({
        name: charge.name,
        description: charge.description || '',
        amount: Number(charge.amount),
        frequency: charge.frequency,
        category_id: charge.category_id,
      });
    } else {
      reset({
        name: '',
        description: '',
        amount: 0,
        frequency: 'monthly',
        category_id: 0,
      });
    }
  }, [charge, reset]);

  const createCharge = useMutation({
    mutationFn: (data: ChargeFormData) => recurringChargesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-charges'] });
      onClose();
    },
  });

  const updateCharge = useMutation({
    mutationFn: (data: ChargeFormData) => recurringChargesApi.update(charge!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-charges'] });
      onClose();
    },
  });

  const onSubmit = (data: ChargeFormData) => {
    if (isEditing) {
      updateCharge.mutate(data);
    } else {
      createCharge.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Modifier la charge' : 'Nouvelle charge fixe'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="Ex: Loyer, Assurance auto..."
            />
            {errors.name && (
              <p className="text-sm text-danger-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
              <p className="text-sm text-danger-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fréquence *
            </label>
            <select {...register('frequency')} className="input">
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
              <p className="text-sm text-danger-500 mt-1">{errors.category_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              className="input resize-none"
              rows={2}
              placeholder="Notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createCharge.isPending || updateCharge.isPending}
              className="btn-primary"
            >
              {createCharge.isPending || updateCharge.isPending
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
