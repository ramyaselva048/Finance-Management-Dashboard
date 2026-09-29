export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export type AuthPageMode = 'login' | 'register' | 'forgot-password';
