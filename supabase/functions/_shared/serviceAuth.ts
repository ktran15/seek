/**
 * Service-call guard — shared by the service-gated Edge Functions
 * (day-close, weekly-payout, admin-moderate). Pure and dependency-free so
 * the same file runs under Deno (Edge) and Node (jest) unchanged.
 *
 * Why not plain `token === SUPABASE_SERVICE_ROLE_KEY`: which key format the
 * platform injects into that env var changed when the project gained
 * publishable/secret API keys — after a redeploy it holds the new
 * `sb_secret_…` key, while `SUPABASE_SECRET_KEYS` carries every active
 * secret key as JSON (`{"default":"sb_secret_…"}`). A service caller is
 * anyone presenting ANY server-side key the runtime was injected with, so
 * the guard compares against the whole set. That keeps SQL-Editor/pg_cron
 * callers working across key migrations and single-key rotations.
 */

/** Bearer token from an Authorization header ('' when absent/blank). */
export function bearerToken(header: string | null): string {
  if (!header) return '';
  return header.replace(/^\s*Bearer\s*/i, '').trim();
}

/** Every key value that authorizes a service call, from the runtime env. */
export function serviceKeySet(env: {
  serviceRoleKey?: string;
  secretKeysJson?: string;
}): Set<string> {
  const keys = new Set<string>();
  const roleKey = env.serviceRoleKey?.trim();
  if (roleKey) keys.add(roleKey);
  if (env.secretKeysJson) {
    try {
      const parsed = JSON.parse(env.secretKeysJson) as Record<string, unknown>;
      for (const value of Object.values(parsed)) {
        if (typeof value === 'string' && value.trim()) keys.add(value.trim());
      }
    } catch {
      // Malformed SUPABASE_SECRET_KEYS: the service-role key alone still gates.
    }
  }
  return keys;
}

/** True when the presented token is one of the service keys. */
export function isServiceToken(token: string, keys: Set<string>): boolean {
  return token.length > 0 && keys.has(token);
}
