'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard } from 'lucide-react';
import { accountsApi } from '@/lib/api';
import type { Account, AccountCreate } from '@/types';

interface AccountFormModalProps {
  account?: Account | null;
  onClose: () => void;
}

export function AccountFormModal({ account, onClose }: AccountFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AccountCreate>>({
    name: '',
    account_type: 'caisse_epargne_joint',
    balance: 0,
    description: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        balance: Number(account.balance),
        description: account.description || '',
      });
    }
  }, [account]);

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AccountCreate>) =>
      accountsApi.update(account!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (account) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData as AccountCreate);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {account ? 'Modifier le compte' : 'Nouveau compte'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Nom du compte *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Compte Joint, Compte Seb..."
            />
          </div>

          {/* Account Type */}
          <div>
            <label
              htmlFor="account_type"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Type de compte *
            </label>
            <select
              id="account_type"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountCreate['account_type'] })}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="caisse_epargne_joint">👫 Caisse Epargne Joint</option>
              <option value="caisse_epargne_seb">👨 Caisse Epargne Seb</option>
              <option value="caisse_epargne_marie">👩 Caisse Epargne Marie</option>
              <option value="n26_seb">👨 N26 Seb</option>
            </select>
          </div>

          {/* Balance */}
          <div>
            <label
              htmlFor="balance"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Solde initial (€) *
            </label>
            <input
              type="number"
              id="balance"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: Number.parseFloat(e.target.value) || 0 })}
              step="0.01"
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Description (optionnelle)
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Notes ou détails supplémentaires..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              Une erreur est survenue lors de l&apos;enregistrement
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
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
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 
                       hover:bg-primary-700 rounded-lg transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : account ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
