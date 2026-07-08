/**
 * admin-moderate — the founder admin removal path (spec §12). Lists open
 * reports and sets removed=true (or restores) on posts/comments; removal
 * closes every open report on the same content as 'actioned'. Removed
 * content disappears from all surfaces immediately: feed_posts/comments RLS
 * and the feed/comments/vote-feed functions all filter on the flag, and
 * cast_vote rejects removed posts (M10 migration).
 *
 * Founder-only tooling — invoked from the SQL Editor via net.http_post
 * (see PROGRESS.md), exactly like day-close and weekly-payout.
 *
 * Invoked service-to-service: deploy with --no-verify-jwt; the caller must
 * present the service-role key, checked explicitly below.
 *
 * Body:
 *   { "action": "list" }
 *     → { reports: [...open reports with context...] }
 *   { "action": "remove" | "restore",
 *     "report_id"?: uuid, "post_id"?: uuid, "comment_id"?: uuid }
 *     → flips removed on the target (explicit id wins over the report's)
 *   { "action": "dismiss", "report_id": uuid }
 *     → report closed with no content change
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  planModeration,
  resolveTarget,
  type ReportTargetRow,
} from '../_shared/moderation.ts';
import { bearerToken, isServiceToken, serviceKeySet } from '../_shared/serviceAuth.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface ModerateBody {
  action?: 'list' | 'remove' | 'restore' | 'dismiss';
  report_id?: string;
  post_id?: string;
  comment_id?: string;
}

Deno.serve(async (req) => {
  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const keys = serviceKeySet({
      serviceRoleKey: serviceKey,
      secretKeysJson: Deno.env.get('SUPABASE_SECRET_KEYS'),
    });
    if (!isServiceToken(bearerToken(req.headers.get('Authorization')), keys)) {
      return json({ error: 'Service calls only' }, 401);
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const body = (await req.json().catch(() => ({}))) as ModerateBody;

    if (body.action === 'list' || body.action === undefined) {
      const { data, error } = await admin.from('open_reports').select('*');
      if (error) throw new Error(error.message);
      return json({ open: data?.length ?? 0, reports: data ?? [] });
    }

    if (body.action === 'dismiss') {
      if (!body.report_id) return json({ error: 'dismiss needs report_id' }, 400);
      const { data, error } = await admin
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', body.report_id)
        .eq('status', 'open')
        .select('id');
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        return json({ error: 'Report not found or already closed' }, 404);
      }
      return json({ dismissed: body.report_id });
    }

    if (body.action !== 'remove' && body.action !== 'restore') {
      return json({ error: `Unknown action '${String(body.action)}'` }, 400);
    }

    let report: ReportTargetRow | null = null;
    if (body.report_id) {
      const { data, error } = await admin
        .from('reports')
        .select('post_id, comment_id, reported_user_id')
        .eq('id', body.report_id)
        .maybeSingle<ReportTargetRow>();
      if (error) throw new Error(error.message);
      if (!data) return json({ error: 'Report not found' }, 404);
      report = data;
    }

    const target = resolveTarget({
      postId: body.post_id,
      commentId: body.comment_id,
      report,
    });
    if ('error' in target) return json({ error: target.error }, 400);

    const plan = planModeration(body.action, target);

    const { data: updated, error: updateError } = await admin
      .from(plan.table)
      .update({ removed: plan.removed })
      .eq('id', plan.targetId)
      .select('id');
    if (updateError) throw new Error(updateError.message);
    if (!updated || updated.length === 0) {
      return json({ error: `${target.kind} not found` }, 404);
    }

    let reportsClosed = 0;
    if (plan.closeOpenReportsAs) {
      const { data: closed, error: closeError } = await admin
        .from('reports')
        .update({ status: plan.closeOpenReportsAs })
        .eq(plan.reportColumn, plan.targetId)
        .eq('status', 'open')
        .select('id');
      if (closeError) throw new Error(closeError.message);
      reportsClosed = closed?.length ?? 0;
    }

    return json({
      action: body.action,
      target: target.kind,
      target_id: plan.targetId,
      removed: plan.removed,
      reports_closed: reportsClosed,
    });
  } catch (e) {
    console.error('[admin-moderate]', e);
    return json({ error: 'Moderation failed' }, 500);
  }
});
