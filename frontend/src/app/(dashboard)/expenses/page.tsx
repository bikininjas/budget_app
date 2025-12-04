import { ExpenseList } from '@/components/expenses/expense-list';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dépenses</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez toutes vos dépenses</p>
      </div>

      <ExpenseList />
    </div>
  );
}
