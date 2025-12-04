'use client';

import { useAuth } from '@/contexts/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gérez les paramètres de votre compte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Profil</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nom d&apos;utilisateur
              </label>
              <p className="text-lg text-slate-900 dark:text-white">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Email
              </label>
              <p className="text-lg text-slate-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nom complet
              </label>
              <p className="text-lg text-slate-900 dark:text-white">{user?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Rôle
              </label>
              <p className="text-lg text-slate-900 dark:text-white capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">À propos</h2>
          <div className="space-y-2">
            <p className="text-slate-600 dark:text-slate-300">
              <strong>DuoBudget</strong> - Application de gestion de budget pour couple
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
