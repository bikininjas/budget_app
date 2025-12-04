'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, X } from 'lucide-react';
import { categoriesApi, accountsApi, usersApi, projectsApi } from '@/lib/api';

export interface ExpenseFiltersType {
  category_id?: number;
  account_id?: number;
  assigned_to_id?: number;
  project_id?: number;
  start_date?: string;
  end_date?: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onChange: (filters: ExpenseFiltersType) => void;
}

export function ExpenseFilters({ filters, onChange }: ExpenseFiltersProps) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  const clearFilters = () => {
    onChange({});
  };

  const updateFilter = <K extends keyof ExpenseFiltersType>(
    key: K,
    value: ExpenseFiltersType[K]
  ) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="card dark:bg-slate-800 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Filtres</span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Effacer
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Catégorie</label>
          <select
            value={filters.category_id || ''}
            onChange={(e) =>
              updateFilter('category_id', Number(e.target.value) || undefined)
            }
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Toutes</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Compte</label>
          <select
            value={filters.account_id || ''}
            onChange={(e) =>
              updateFilter('account_id', Number(e.target.value) || undefined)
            }
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Tous</option>
            {accounts?.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Assigné à</label>
          <select
            value={filters.assigned_to_id || ''}
            onChange={(e) =>
              updateFilter('assigned_to_id', Number(e.target.value) || undefined)
            }
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Tous</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Projet</label>
          <select
            value={filters.project_id || ''}
            onChange={(e) =>
              updateFilter('project_id', Number(e.target.value) || undefined)
            }
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Tous</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Date début</label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => updateFilter('start_date', e.target.value || undefined)}
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Date fin</label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => updateFilter('end_date', e.target.value || undefined)}
            className="input text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
