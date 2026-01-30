import api from './client';
import { Project, ProjectMember } from '../types';

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>('/projects');
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(name: string): Promise<Project> {
  const response = await api.post<Project>('/projects', { name });
  return response.data;
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const response = await api.put<Project>(`/projects/${id}`, { name });
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function uploadProjectImage(id: string, file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<{ image: string }>(`/projects/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  canCreateVibes = true
): Promise<ProjectMember> {
  const response = await api.post<ProjectMember>(`/projects/${projectId}/members`, {
    userId,
    canCreateVibes,
  });
  return response.data;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}
