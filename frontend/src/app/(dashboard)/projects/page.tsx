import { ProjectList } from '@/components/projects/project-list';
import { AddProjectButton } from '@/components/projects/add-project-button';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projets</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez vos objectifs d&apos;épargne</p>
        </div>
        <AddProjectButton />
      </div>

      <ProjectList />
    </div>
  );
}
