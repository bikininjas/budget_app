'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Nom d\'utilisateur requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const magicLinkMutation = useMutation({
    mutationFn: (email: string) => authApi.requestMagicLink({ email }),
    onSuccess: () => {
      setMagicLinkSent(true);
      setError(null);
    },
    onError: () => {
      setError('Une erreur est survenue');
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
    } catch {
      setError('Identifiants incorrects');
    }
  };

  const onSubmitEmail = (data: EmailFormData) => {
    setError(null);
    magicLinkMutation.mutate(data.email);
  };

  // Magic link sent confirmation
  if (magicLinkSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Email envoyé ! 📧
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Si cet email est enregistré, vous recevrez un lien pour définir votre mot de passe.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Le lien expire dans 15 minutes.
        </p>
        <button
          onClick={() => {
            setShowMagicLinkForm(false);
            setMagicLinkSent(false);
          }}
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  // Magic link request form
  if (showMagicLinkForm) {
    return (
      <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Première connexion ?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Entrez votre email pour recevoir un lien de création de mot de passe.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="label block mb-1 text-slate-700 dark:text-slate-200">
            Adresse email
          </label>
          <input
            {...registerEmail('email')}
            type="email"
            id="email"
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="votre@email.fr"
            autoComplete="email"
          />
          {emailErrors.email && (
            <p className="error-message text-danger-600 dark:text-danger-400">{emailErrors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={magicLinkMutation.isPending}
          className="btn-primary btn-md w-full"
        >
          {magicLinkMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Envoyer le lien
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowMagicLinkForm(false)}
          className="w-full text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm"
        >
          J&apos;ai déjà un mot de passe
        </button>
      </form>
    );
  }

  // Standard login form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="label block mb-1 text-slate-700 dark:text-slate-200">
          Nom d&apos;utilisateur
        </label>
        <input
          {...register('username')}
          type="text"
          id="username"
          className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
          placeholder="seb ou marie"
          autoComplete="username"
        />
        {errors.username && (
          <p className="error-message text-danger-600 dark:text-danger-400">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="label block mb-1 text-slate-700 dark:text-slate-200">
          Mot de passe
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="input pr-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="error-message text-danger-600 dark:text-danger-400">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary btn-md w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connexion...
          </>
        ) : (
          'Se connecter'
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowMagicLinkForm(true)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Première connexion ? Créer mon mot de passe
        </button>
      </div>
    </form>
  );
}
