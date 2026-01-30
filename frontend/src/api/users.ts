import api from './client';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'MEMBER';
}): Promise<User> {
  const response = await api.post<User>('/users', data);
  return response.data;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    name?: string;
    role?: 'ADMIN' | 'MEMBER';
  }
): Promise<User> {
  const response = await api.put<User>(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
