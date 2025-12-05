'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { ChangePassword } from '@/types';

export function ChangePasswordForm() {
  const [formData, setFormData] = useState<ChangePassword & { confirm_password: string }>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ChangePassword) => authApi.changePassword(data),
    onSuccess: (data) => {
      setSuccess(data.message);
      setError(null);
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.new_password !== formData.confirm_password) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    mutation.mutate({
      current_password: formData.current_password,
      new_password: formData.new_password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="current_password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Mot de passe actuel
        </label>
        <input
          type="password"
          id="current_password"
          value={formData.current_password}
          onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label
          htmlFor="new_password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Nouveau mot de passe
        </label>
        <input
          type="password"
          id="new_password"
          value={formData.new_password}
          onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          minLength={8}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Minimum 8 caractères
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Confirmer le nouveau mot de passe
        </label>
        <input
          type="password"
          id="confirm_password"
          value={formData.confirm_password}
          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
      </button>
    </form>
  );
}
