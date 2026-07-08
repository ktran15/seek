/**
 * Admin moderation plan logic (spec §12) — pure and dependency-free, shared
 * by the admin-moderate Edge Function and the jest suite.
 *
 * The founder acts on a report (or directly on a post/comment id); these
 * functions turn that request into an explicit plan: which table to flip
 * `removed` on, and what happens to open reports pointing at the target.
 * Getting this wrong is invisible until real moderation happens, so it
 * stays pure and unit-tested.
 */

export type ModerationAction = 'remove' | 'restore' | 'dismiss';

/** The report columns the plan needs (subset of a reports row). */
export interface ReportTargetRow {
  post_id: string | null;
  comment_id: string | null;
  reported_user_id: string | null;
}

export type ModerationTarget =
  | { kind: 'post'; id: string }
  | { kind: 'comment'; id: string };

export interface ModerationRequest {
  postId?: string | null;
  commentId?: string | null;
  report?: ReportTargetRow | null;
}

/**
 * Resolve what content a request points at. Explicit ids win over the
 * report's own target; a post target wins over a comment target when a
 * report somehow carries both. User-only reports have no removable content
 * — they can only be dismissed (or the user handled directly).
 */
export function resolveTarget(
  request: ModerationRequest,
): ModerationTarget | { error: string } {
  if (request.postId) return { kind: 'post', id: request.postId };
  if (request.commentId) return { kind: 'comment', id: request.commentId };
  const report = request.report;
  if (report?.post_id) return { kind: 'post', id: report.post_id };
  if (report?.comment_id) return { kind: 'comment', id: report.comment_id };
  if (report?.reported_user_id) {
    return {
      error:
        'This report targets a user, not content — dismiss it or act on their posts/comments directly',
    };
  }
  return { error: 'Nothing to moderate: no post, comment, or report target' };
}

export interface ModerationPlan {
  /** Table whose `removed` flag flips. */
  table: 'feed_posts' | 'comments';
  targetId: string;
  /** Value written to `removed`. */
  removed: boolean;
  /** reports column matching the target, for closing open reports. */
  reportColumn: 'post_id' | 'comment_id';
  /**
   * What to set open reports on this target to. Removal actions every open
   * report on the same content (one takedown answers them all); a restore
   * leaves report history untouched.
   */
  closeOpenReportsAs: 'actioned' | null;
}

/** Turn a remove/restore on a resolved target into an explicit plan. */
export function planModeration(
  action: Exclude<ModerationAction, 'dismiss'>,
  target: ModerationTarget,
): ModerationPlan {
  return {
    table: target.kind === 'post' ? 'feed_posts' : 'comments',
    targetId: target.id,
    removed: action === 'remove',
    reportColumn: target.kind === 'post' ? 'post_id' : 'comment_id',
    closeOpenReportsAs: action === 'remove' ? 'actioned' : null,
  };
}
