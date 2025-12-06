import api from './client';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectContribution,
  ProjectContributionCreate,
} from '@/types';

export const projectsApi = {
  getAll: async (includeCompleted = false): Promise<Project[]> => {
    const params = new URLSearchParams();
    params.append('include_completed', String(includeCompleted));
    
    const response = await api.get<Project[]>('/projects', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (project: ProjectCreate): Promise<Project> => {
    const response = await api.post<Project>('/projects', project);
    return response.data;
  },

  update: async (id: number, project: ProjectUpdate): Promise<Project> => {
    const response = await api.patch<Project>(`/projects/${id}`, project);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addContribution: async (
    projectId: number,
    contribution: ProjectContributionCreate
  ): Promise<ProjectContribution> => {
    const response = await api.post<ProjectContribution>(
      `/projects/${projectId}/contributions`,
      contribution
    );
    return response.data;
  },

  getContributions: async (projectId: number): Promise<ProjectContribution[]> => {
    const response = await api.get<ProjectContribution[]>(
      `/projects/${projectId}/contributions`
    );
    return response.data;
  },

  removeContribution: async (projectId: number, contributionId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/contributions/${contributionId}`);
  },
};

export default projectsApi;
