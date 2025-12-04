import { AccountList } from '@/components/accounts/account-list';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comptes bancaires</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos comptes bancaires</p>
      </div>

      <AccountList />
    </div>
  );
}
