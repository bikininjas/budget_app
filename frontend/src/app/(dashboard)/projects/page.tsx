import { ProjectList } from '@/components/projects/project-list';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projets</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez vos objectifs d&apos;épargne</p>
      </div>

      <ProjectList />
    </div>
  );
}
