/**
 * delete-account — the Apple-required in-app account deletion (spec §12),
 * the ONE sanctioned hard-delete in the product (spec §6 deletion policy).
 *
 * The caller deletes THEMSELVES: JWT-verified (deploy normally, no
 * --no-verify-jwt), the target uid comes only from the verified token —
 * there is no "delete user X" parameter to abuse.
 *
 * Order matters for retry-safety:
 *   1. Purge the user's storage folders (proofs, comment-media) — FK
 *      cascades can't reach storage, and doing this first means a failure
 *      leaves the account intact and the whole call retryable.
 *   2. auth.admin.deleteUser(uid) — auth.users → profiles cascades the
 *      entire DB graph (CASCADE_PLAN in _shared/deletion.ts is the tested
 *      mirror of those FK clauses; survivors' H2H rows anonymize via
 *      SET NULL per the founder-approved decision).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  batchPaths,
  USER_MEDIA_BUCKETS,
  userStoragePrefix,
} from '../_shared/deletion.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const LIST_PAGE = 1000;

/** Every object path under `prefix/` in a bucket (folders walked, paged). */
async function listAllPaths(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  const folders = [prefix];
  while (folders.length > 0) {
    const folder = folders.pop() as string;
    let offset = 0;
    for (;;) {
      const { data: entries, error } = await admin.storage
        .from(bucket)
        .list(folder, { limit: LIST_PAGE, offset });
      if (error) throw new Error(`list ${bucket}/${folder}: ${error.message}`);
      for (const entry of entries ?? []) {
        // Storage folders are virtual: entries without an id are prefixes.
        if (entry.id) paths.push(`${folder}/${entry.name}`);
        else folders.push(`${folder}/${entry.name}`);
      }
      if ((entries?.length ?? 0) < LIST_PAGE) break;
      offset += LIST_PAGE;
    }
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData.user) return json({ error: 'Not signed in' }, 401);
    const userId = userData.user.id;

    // 1. Storage purge (see header comment for why this goes first).
    let filesRemoved = 0;
    for (const bucket of USER_MEDIA_BUCKETS) {
      const paths = await listAllPaths(admin, bucket, userStoragePrefix(userId));
      for (const batch of batchPaths(paths)) {
        const { error } = await admin.storage.from(bucket).remove(batch);
        if (error) throw new Error(`purge ${bucket}: ${error.message}`);
        filesRemoved += batch.length;
      }
    }

    // 2. Auth-user delete — cascades profiles and the entire DB graph.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw new Error(`auth delete: ${deleteError.message}`);

    return json({ deleted: true, files_removed: filesRemoved });
  } catch (e) {
    console.error('[delete-account]', e);
    return json({ error: 'Account deletion failed — your account is still active. Try again.' }, 500);
  }
});
