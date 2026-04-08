import { adminGet, adminPatch, adminPost } from './esl/apiClient';
import type { AdminDashboardSummary, AdminUser } from '../types/admin';
import type { AppUserRole } from '../types/auth';

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const result = await adminGet<AdminDashboardSummary>('/dashboard');
  return result.data as AdminDashboardSummary;
}

export async function listAdminUsers({ search = '', role = '' }: { search?: string; role?: string } = {}): Promise<AdminUser[]> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (role.trim()) {
    params.set('role', role.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const result = await adminGet<AdminUser[]>(`/users${suffix}`);
  return Array.isArray(result.data) ? result.data : [];
}

export async function createAdminUser(input: { email: string; password: string; role: AppUserRole }): Promise<AdminUser> {
  const result = await adminPost<AdminUser, typeof input>('/users', input);
  return result.data as AdminUser;
}

export async function updateAdminUser(userId: string, input: { email?: string; role?: AppUserRole }): Promise<AdminUser> {
  const result = await adminPatch<AdminUser, typeof input>(`/users/${encodeURIComponent(userId)}`, input);
  return result.data as AdminUser;
}

export async function resetAdminUserPassword(userId: string, password: string): Promise<{ revoked_sessions: number }> {
  const result = await adminPost<{ revoked_sessions: number }, { password: string }>(
    `/users/${encodeURIComponent(userId)}/reset-password`,
    { password }
  );
  return result.data as { revoked_sessions: number };
}

export async function revokeAdminUserSessions(userId: string): Promise<{ revoked_sessions: number }> {
  const result = await adminPost<{ revoked_sessions: number }, Record<string, never>>(
    `/users/${encodeURIComponent(userId)}/revoke-sessions`,
    {}
  );
  return result.data as { revoked_sessions: number };
}
