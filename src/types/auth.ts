export type AppUserRole = 'usuario' | 'administrador' | 'desenvolvedor';

export type AuthUser = {
  id: string;
  email: string;
  role: AppUserRole;
  created_at: string;
  updated_at: string;
};
