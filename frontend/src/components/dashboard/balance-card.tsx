'use client';

import { useQuery } from '@tanstack/react-query';
import { expensesApi, usersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function BalanceCard() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const sebUser = users?.find((u) => u.username === 'seb');
  const marieUser = users?.find((u) => u.username === 'marie');

  const { data: balance, isLoading } = useQuery({
    queryKey: ['user-balance', sebUser?.id, marieUser?.id],
    queryFn: () =>
      sebUser && marieUser
        ? expensesApi.getUserBalance(sebUser.id, marieUser.id)
        : null,
    enabled: !!sebUser && !!marieUser,
  });

  if (isLoading || !balance) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500">
        Chargement...
      </div>
    );
  }

  const sebBalance = Number(balance.user1_balance);
  const marieBalance = Number(balance.user2_balance);

  // Positive balance means they owe money, negative means they're owed
  const maxBalance = Math.max(Math.abs(sebBalance), Math.abs(marieBalance), 1);
  const sebWidth = Math.abs(sebBalance) / maxBalance;
  const marieWidth = Math.abs(marieBalance) / maxBalance;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Seb</p>
          <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(Number(balance.user1_paid))}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">payé</p>
        </div>
        <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
          <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Marie</p>
          <p className="text-lg sm:text-xl font-bold text-pink-700 dark:text-pink-300">
            {formatCurrency(Number(balance.user2_paid))}
          </p>
          <p className="text-xs text-pink-500 dark:text-pink-400 mt-1">payé</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs sm:text-sm mb-2">
          <span className="text-blue-600 dark:text-blue-400">Seb doit recevoir</span>
          <span className="text-pink-600 dark:text-pink-400">Marie doit recevoir</span>
        </div>
        <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-300 dark:bg-slate-500 z-10" />
          
          {sebBalance > 0 && (
            <div
              className="absolute right-1/2 h-full bg-blue-500 rounded-l-full transition-all duration-500"
              style={{ width: `${sebWidth * 50}%` }}
            />
          )}
          {marieBalance > 0 && (
            <div
              className="absolute left-1/2 h-full bg-pink-500 rounded-r-full transition-all duration-500"
              style={{ width: `${marieWidth * 50}%` }}
            />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs font-bold text-slate-700 dark:text-slate-200">
              {sebBalance > 0
                ? `Seb doit ${formatCurrency(sebBalance)}`
                : marieBalance > 0
                ? `Marie doit ${formatCurrency(marieBalance)}`
                : 'Équilibré'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        {sebBalance > 0 ? (
          <p>
            <strong className="text-slate-700 dark:text-slate-200">Seb</strong> doit{' '}
            <strong className="text-pink-600 dark:text-pink-400">{formatCurrency(sebBalance)}</strong> à{' '}
            <strong className="text-slate-700 dark:text-slate-200">Marie</strong>
          </p>
        ) : marieBalance > 0 ? (
          <p>
            <strong className="text-slate-700 dark:text-slate-200">Marie</strong> doit{' '}
            <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(marieBalance)}</strong> à{' '}
            <strong className="text-slate-700 dark:text-slate-200">Seb</strong>
          </p>
        ) : (
          <p>Les comptes sont équilibrés 🎉</p>
        )}
      </div>
    </div>
  );
}
