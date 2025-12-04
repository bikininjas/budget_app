import { DashboardStats } from '@/components/dashboard/stats';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble de vos finances</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Dépenses par catégorie</h2>
          <CategoryPieChart />
        </div>
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Équilibre Seb / Marie</h2>
          <BalanceCard />
        </div>
      </div>

      <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Évolution mensuelle</h2>
        <ExpenseChart />
      </div>

      <div className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Dépenses récentes</h2>
        <RecentExpenses />
      </div>
    </div>
  );
}
