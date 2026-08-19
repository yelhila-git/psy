import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Psychologist } from '@/types';
import { ApiError, isLive } from '@/lib/api-client';
import { psychologistService } from '@/lib/services';

/** The cookie the login page writes the Sanctum token to. */
export const TOKEN_COOKIE = 'amp_token';

/**
 * The signed-in user's API token, read server-side.
 *
 * The dashboard pages are server components, so they cannot reach the token
 * through the browser — it travels on a cookie and is handed to the service
 * layer explicitly rather than being picked up from ambient state.
 */
export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

/**
 * The practitioner whose dashboard is being rendered.
 *
 * On mocks there is no session to speak of, so the demo keeps working without
 * a token. Once `/me` is live, a missing or rejected token can only mean the
 * visitor is not signed in — which is a redirect, not an error page.
 */
export async function currentPsychologist(): Promise<Psychologist> {
  const token = await sessionToken();
  if (!token && isLive('psychologists.current')) redirect('/login');

  try {
    return await psychologistService.current(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }
}
