import { CategoryList } from '@/components/categories/category-list';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catégories</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos catégories de dépenses</p>
      </div>

      <CategoryList />
    </div>
  );
}
