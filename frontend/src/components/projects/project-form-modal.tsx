'use client';

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';

const projectSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  target_amount: z.coerce.number().positive('Montant cible requis'),
  deadline: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_completed: z.boolean().default(false),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  project,
}: ProjectFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      target_amount: 0,
      deadline: null,
      is_active: true,
      is_completed: false,
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        target_amount: project.target_amount,
        deadline: project.deadline?.split('T')[0] || null,
        is_active: project.is_active,
        is_completed: project.is_completed,
      });
    } else {
      reset({
        name: '',
        description: '',
        target_amount: 0,
        deadline: null,
        is_active: true,
        is_completed: false,
      });
    }
  }, [project, reset]);

  const createProject = useMutation({
    mutationFn: (data: ProjectFormData) =>
      projectsApi.create({
        name: data.name,
        description: data.description,
        target_amount: data.target_amount,
        deadline: data.deadline || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const updateProject = useMutation({
    mutationFn: (data: ProjectFormData) =>
      projectsApi.update(project!.id, {
        name: data.name,
        description: data.description,
        target_amount: data.target_amount,
        deadline: data.deadline || undefined,
        is_active: data.is_active,
        is_completed: data.is_completed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (isEditing) {
      updateProject.mutate(data);
    } else {
      createProject.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="Ex: Vacances été 2024"
            />
            {errors.name && (
              <p className="text-sm text-danger-500 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              className="input resize-none"
              rows={2}
              placeholder="Description du projet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant cible (€) *
            </label>
            <input
              {...register('target_amount')}
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
            />
            {errors.target_amount && (
              <p className="text-sm text-danger-500 mt-1">
                {errors.target_amount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date limite
            </label>
            <input
              {...register('deadline')}
              type="date"
              className="input"
            />
          </div>

          {isEditing && (
            <>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">Projet actif</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('is_completed')}
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">Projet terminé</span>
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createProject.isPending || updateProject.isPending}
              className="btn-primary"
            >
              {createProject.isPending || updateProject.isPending
                ? 'Enregistrement...'
                : isEditing
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
