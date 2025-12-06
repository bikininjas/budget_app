'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Wallet, Plus, Pencil, Trash2 } from 'lucide-react';
import { accountsApi } from '@/lib/api';
import { formatCurrency, ACCOUNT_TYPE_LABELS } from '@/lib/utils';
import { AccountFormModal } from './account-form-modal';
import type { Account } from '@/types';

export function AccountList() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
        Chargement...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau compte
          </button>
        </div>
        <div className="p-12 text-center">
          <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Aucun compte
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Vous n&apos;avez pas encore de compte bancaire configuré.
          </p>
        </div>

        {isFormOpen && (
          <AccountFormModal account={editingAccount} onClose={handleCloseModal} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditingAccount(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau compte
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {accounts.map((account) => {
        const isJoint = account.account_type.includes('joint');
        const isSeb = account.account_type.includes('seb');
        const isMarie = account.account_type.includes('marie');

        const bgColor = isJoint
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700'
          : isSeb
          ? 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700'
          : isMarie
          ? 'bg-gradient-to-br from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-700'
          : 'bg-gradient-to-br from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800';

        const ownerLabel = isJoint ? '👫 Compte Joint' : isSeb ? '👨 Seb' : isMarie ? '👩 Marie' : '';

        return (
          <div
            key={account.id}
            className={`${bgColor} rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {ownerLabel}
                  </span>
                </div>
                <p className="text-white/70 text-xs sm:text-sm truncate">
                  {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}
                </p>
                <h3 className="text-base sm:text-lg font-semibold mt-1 truncate">
                  {account.name}
                </h3>
              </div>
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-white/50 flex-shrink-0" />
            </div>

            <div className="mb-4">
              <p className="text-white/70 text-xs sm:text-sm mb-1">Solde</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {formatCurrency(Number(account.balance))}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/20">
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  account.is_active
                    ? 'bg-white/20 text-white'
                    : 'bg-red-500/50 text-white'
                }`}
              >
                {account.is_active ? 'Actif' : 'Inactif'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {isFormOpen && (
        <AccountFormModal account={editingAccount} onClose={handleCloseModal} />
      )}
    </>
  );
}
