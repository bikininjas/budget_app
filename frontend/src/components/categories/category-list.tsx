'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types';
import { CategoryFormModal } from './category-form-modal';
import { CategoryIcon } from '@/components/ui/category-icon';

export function CategoryList() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleDelete = (category: Category) => {
    if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      deleteCategory.mutate(category.id);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500">Chargement...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 btn-md"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle catégorie</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-8 text-center text-slate-400 dark:text-slate-500">
          Aucune catégorie créée
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 font-medium">Catégorie</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Couleur</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <CategoryIcon
                            icon={category.icon}
                            className="w-5 h-5"
                            style={{ color: category.color }}
                          />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      {category.description || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {category.color}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.is_active
                            ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <CategoryIcon
                        icon={category.icon}
                        className="w-6 h-6"
                        style={{ color: category.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {category.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400"
                      disabled={deleteCategory.isPending}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        category={editingCategory}
      />
    </div>
  );
}
