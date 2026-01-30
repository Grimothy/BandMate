import api from './client';
import { Vibe } from '../types';

export async function getVibes(projectId: string): Promise<Vibe[]> {
  const response = await api.get<Vibe[]>(`/vibes/project/${projectId}`);
  return response.data;
}

export async function getVibe(id: string): Promise<Vibe> {
  const response = await api.get<Vibe>(`/vibes/${id}`);
  return response.data;
}

export async function createVibe(
  projectId: string,
  data: { name: string; theme?: string; notes?: string }
): Promise<Vibe> {
  const response = await api.post<Vibe>(`/vibes/project/${projectId}`, data);
  return response.data;
}

export async function updateVibe(
  id: string,
  data: { name?: string; theme?: string; notes?: string }
): Promise<Vibe> {
  const response = await api.put<Vibe>(`/vibes/${id}`, data);
  return response.data;
}

export async function deleteVibe(id: string): Promise<void> {
  await api.delete(`/vibes/${id}`);
}

export async function uploadVibeImage(id: string, file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<{ image: string }>(`/vibes/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
