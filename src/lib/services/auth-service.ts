import type { BaseUser, Patient, Psychologist } from '@/types';
import { api, isLive } from '@/lib/api-client';
import { patientById, CURRENT_PATIENT_ID } from '@/lib/mock/patients';

/**
 * The API's `role` enum carries an `admin` the domain types never modelled —
 * there is no admin profile table, so an admin is a bare `BaseUser`.
 */
export type AdminUser = BaseUser & { role: 'admin' };
export type AuthUser = Patient | Psychologist | AdminUser;
export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Authentication against the Laravel API's Sanctum personal access tokens.
 *
 * The mock branch keeps the demo usable with the API stopped, exactly as every
 * other service does — it hands back the current mock patient and a fake token.
 */
export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    if (isLive('auth')) return api.post<AuthResult>('/login', { email, password });
    return { token: 'mock-token', user: patientById.get(CURRENT_PATIENT_ID)! };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    if (isLive('auth')) {
      return api.post<AuthResult>('/register', {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
      });
    }
    return { token: 'mock-token', user: patientById.get(CURRENT_PATIENT_ID)! };
  },

  async logout(token: string): Promise<void> {
    if (isLive('auth')) await api.post<void>('/logout', undefined, { token });
  },

  async me(token: string): Promise<AuthUser> {
    if (isLive('auth')) return api.get<AuthUser>('/me', { token });
    return patientById.get(CURRENT_PATIENT_ID)!;
  },
};
