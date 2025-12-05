'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/auth-context';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<{ email: string; full_name: string } | null>(null);

  // Verify token on mount
  const verifyMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyMagicLink(token),
    onSuccess: (data) => {
      setUserInfo({ email: data.email, full_name: data.full_name });
    },
    onError: () => {
      setError('Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.');
    },
  });

  // Set password mutation
  const setPasswordMutation = useMutation({
    mutationFn: (data: { token: string; new_password: string }) =>
      authApi.setInitialPassword(data),
    onSuccess: (data) => {
      // Auto-login with the returned token
      login(data.access_token);
      router.push('/dashboard');
    },
    onError: (err: Error) => {
      setError(err.message || 'Une erreur est survenue');
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setPasswordMutation.mutate({ token, new_password: password });
  };

  // Loading state
  if (verifyMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (verifyMutation.isError || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h1>
            <p className="text-gray-600 mb-6">
              Ce lien est invalide ou a expiré. Veuillez retourner à la page de connexion et demander un nouveau lien.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            🏦 DuoBudget
          </h1>
          <p className="text-gray-600 mt-2">Créez votre mot de passe</p>
        </div>

        {userInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-purple-800">
              Bienvenue <strong>{userInfo.full_name}</strong> ! 👋
            </p>
            <p className="text-purple-600 text-sm mt-1">{userInfo.email}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Répétez le mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={setPasswordMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {setPasswordMutation.isPending ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Création en cours...
              </span>
            ) : (
              'Créer mon mot de passe'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
