import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">DuoBudget</h1>
            <p className="text-slate-500 dark:text-slate-400">Gérez votre budget à deux</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
