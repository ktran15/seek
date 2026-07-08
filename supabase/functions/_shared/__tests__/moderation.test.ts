import {
  planModeration,
  resolveTarget,
  type ReportTargetRow,
} from '../moderation';

const userOnlyReport: ReportTargetRow = {
  post_id: null,
  comment_id: null,
  reported_user_id: 'user-1',
};

describe('resolveTarget', () => {
  it('explicit ids win over the report target', () => {
    expect(
      resolveTarget({
        postId: 'post-x',
        report: { post_id: 'post-y', comment_id: null, reported_user_id: null },
      }),
    ).toEqual({ kind: 'post', id: 'post-x' });
    expect(
      resolveTarget({
        commentId: 'comment-x',
        report: { post_id: 'post-y', comment_id: null, reported_user_id: null },
      }),
    ).toEqual({ kind: 'comment', id: 'comment-x' });
  });

  it('falls back to the report target, post over comment', () => {
    expect(
      resolveTarget({
        report: { post_id: 'post-r', comment_id: null, reported_user_id: null },
      }),
    ).toEqual({ kind: 'post', id: 'post-r' });
    expect(
      resolveTarget({
        report: { post_id: null, comment_id: 'comment-r', reported_user_id: null },
      }),
    ).toEqual({ kind: 'comment', id: 'comment-r' });
    expect(
      resolveTarget({
        report: {
          post_id: 'post-r',
          comment_id: 'comment-r',
          reported_user_id: null,
        },
      }),
    ).toEqual({ kind: 'post', id: 'post-r' });
  });

  it('user-only reports have no removable content', () => {
    const result = resolveTarget({ report: userOnlyReport });
    expect(result).toHaveProperty('error');
  });

  it('errors when there is no target at all', () => {
    expect(resolveTarget({})).toHaveProperty('error');
    expect(resolveTarget({ report: null })).toHaveProperty('error');
  });

  it('a report whose content was deleted (target set null) errors instead of acting', () => {
    // reports.post_id/comment_id are ON DELETE SET NULL — a stale report
    // must never silently no-op or hit the wrong row.
    expect(
      resolveTarget({
        report: { post_id: null, comment_id: null, reported_user_id: null },
      }),
    ).toHaveProperty('error');
  });
});

describe('planModeration', () => {
  it('remove post: flips feed_posts.removed and actions every open report on it', () => {
    expect(planModeration('remove', { kind: 'post', id: 'p1' })).toEqual({
      table: 'feed_posts',
      targetId: 'p1',
      removed: true,
      reportColumn: 'post_id',
      closeOpenReportsAs: 'actioned',
    });
  });

  it('remove comment: flips comments.removed via comment_id reports', () => {
    expect(planModeration('remove', { kind: 'comment', id: 'c1' })).toEqual({
      table: 'comments',
      targetId: 'c1',
      removed: true,
      reportColumn: 'comment_id',
      closeOpenReportsAs: 'actioned',
    });
  });

  it('restore clears removed but never rewrites report history', () => {
    const plan = planModeration('restore', { kind: 'post', id: 'p1' });
    expect(plan.removed).toBe(false);
    expect(plan.closeOpenReportsAs).toBeNull();
  });
});
