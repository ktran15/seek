import { Redirect, useLocalSearchParams } from 'expo-router';

import { CommentSheet } from '@/features/feed/CommentSheet';
import type { CommentView } from '@/features/feed/useFeed';

/**
 * DEV-ONLY visual preview of the comment sheet (never reachable in release
 * builds): renders the real CommentSheet inside the real formSheet route
 * with hard-coded mock threads, so sheet layout can be verified in the
 * simulator without touching the beta database.
 *
 * Open via deep link, e.g.:
 *   exp://127.0.0.1:8081/--/dev/comment-sheet-preview?thread=short
 *   ...?thread=long   ...&focus=1 (raises the keyboard on mount)
 */

function mockComment(
  n: number,
  body: string,
  name: string,
  parent: string | null = null,
  likes = 0,
): CommentView {
  return {
    id: `mock-${n}`,
    post_id: 'mock-post',
    user_id: `mock-user-${n}`,
    username: name.toLowerCase().replace(/\s+/g, ''),
    display_name: name,
    body,
    media_url: null,
    parent_comment_id: parent,
    like_count: likes,
    viewer_liked: likes > 2,
    created_at: new Date(Date.now() - n * 60_000).toISOString(),
  };
}

const SHORT_THREAD: CommentView[] = [
  mockComment(1, 'Absolutely crushed it today. That time is unreal 🔥', 'Francisco Alvarado', null, 3),
];

const LONG_THREAD: CommentView[] = [
  mockComment(1, 'Absolutely crushed it today. That time is unreal 🔥', 'Francisco Alvarado', null, 5),
  mockComment(2, 'No shot that was one attempt 😂', 'Katie Tran', 'mock-1', 2),
  mockComment(3, 'One attempt, one legend.', 'Francisco Alvarado', 'mock-1'),
  mockComment(4, 'Okay this challenge broke me, respect.', 'Sam Okafor', null, 1),
  mockComment(5, 'The clock overlay makes this so satisfying to watch.', 'Priya Nair', null, 4),
  mockComment(6, 'Rematch tomorrow. I want my crown back.', 'Katie Tran', null),
  mockComment(7, 'You drank that like it owed you money.', 'Diego Ruiz', null, 7),
  mockComment(8, 'Coach says hydration is key. You listened. A+.', 'Maya Chen', 'mock-7'),
  mockComment(9, 'This is the content I signed up for.', 'Leo Park', null),
  mockComment(10, 'Summit by Friday at this pace ⛰️', 'Ana Sousa', null, 2),
  mockComment(11, 'I blinked and it was over.', 'Tom Reilly', null),
  mockComment(
    12,
    'Longer comment to check wrapping: the sheet has to keep every row readable, aligned, and clear of both the title up top and the composer down bottom, even when someone writes an absolute essay like this one.',
    'Nia Williams',
    null,
    1,
  ),
];

export default function CommentSheetPreview() {
  const { thread, focus } = useLocalSearchParams<{ thread?: string; focus?: string }>();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <CommentSheet
      comments={thread === 'short' ? SHORT_THREAD : LONG_THREAD}
      isLoading={false}
      hasError={false}
      isRefetching={false}
      onRetry={() => undefined}
      posterName="Francisco"
      myInitial="F"
      onToggleLike={() => undefined}
      onSend={async () => undefined}
      onPickImage={async () => null}
      onTakePhoto={async () => null}
      autoFocusInput={focus === '1'}
    />
  );
}
