'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Target } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { ProjectFormModal } from './project-form-modal';

export function ProjectList() {
  const queryClient = useQueryClient();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const deleteProject = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = (project: Project) => {
    if (confirm(`Supprimer le projet "${project.name}" ?`)) {
      deleteProject.mutate(project.id);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
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
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau projet</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-12 text-center">
          <Target className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Aucun projet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Créez votre premier projet d&apos;épargne.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = project.progress_percentage;
            const isCompleted = project.is_completed;
            const isNearGoal = progress >= 75 && !isCompleted;

            return (
              <div key={project.id} className="card dark:bg-slate-800 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-1.5 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                      disabled={deleteProject.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isCompleted ? 'Objectif atteint' : 'Progression'}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {formatCurrency(Number(project.current_amount))} /{' '}
                      {formatCurrency(Number(project.target_amount))}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-success-500'
                          : isNearGoal
                          ? 'bg-warning-500'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">
                    {progress.toFixed(0)}% de l&apos;objectif
                  </p>
                </div>

                {project.deadline && (
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span>
                      Date limite: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                          : project.is_active
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isCompleted ? 'Terminé' : project.is_active ? 'En cours' : 'Inactif'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        project={editingProject}
      />
    </div>
  );
}
