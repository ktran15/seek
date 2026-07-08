import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/features/auth/useSession';
import { CommentSheet } from '@/features/feed/CommentSheet';
import {
  pickCommentImage,
  takeCommentPhoto,
  uploadCommentImage,
} from '@/features/feed/commentMedia';
import {
  REPORT_REASONS,
  useAddComment,
  useComments,
  useReport,
  useToggleCommentLike,
  type CommentView,
} from '@/features/feed/useFeed';
import { useProfile } from '@/features/profile/useProfile';

/**
 * Comments route: wires the live data hooks into the presentational
 * CommentSheet (which the dev preview renders with mock data instead).
 */
export default function CommentsScreen() {
  const { postId, name: posterName } = useLocalSearchParams<{
    postId: string;
    name?: string;
  }>();
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: myProfile } = useProfile(userId);
  const navigation = useNavigation();

  // Tap-to-expand, smooth (founder refinement 1): UIKit already slides the
  // sheet up WITH the keyboard using the sheet's own spring — the same
  // animator as the comment-button open. Changing detents mid-animation is
  // what caused the instant jump, so we pin the full detent only AFTER the
  // keyboard animation settles (a visual no-op by then; it just keeps the
  // sheet expanded). Native animations respect system Reduce Motion.
  //
  // Two-stage collapse (refinement 2): while typing, the sheet's dismiss
  // gesture is disabled — a downward swipe can only scroll the list, whose
  // keyboardDismissMode drops the keyboard (stage 1, sheet stays expanded).
  // On blur the gesture returns and the pinned single detent means the next
  // swipe-down closes the whole sheet (stage 2) — never both in one swipe.
  const pinSub = useRef<{ remove: () => void } | null>(null);
  const onInputFocusChange = (focused: boolean) => {
    if (focused) {
      pinSub.current?.remove();
      const sub = Keyboard.addListener('keyboardDidShow', () => {
        sub.remove();
        pinSub.current = null;
        navigation.setOptions({
          sheetAllowedDetents: [0.95],
          gestureEnabled: false,
        });
      });
      pinSub.current = sub;
    } else {
      navigation.setOptions({ gestureEnabled: true });
    }
  };
  useEffect(() => () => pinSub.current?.remove(), []);

  const { data: comments, isLoading, error, refetch, isRefetching } = useComments(postId);
  const addComment = useAddComment(userId);
  const toggleLike = useToggleCommentLike(userId);
  const report = useReport(userId);

  // Same reason picker as post reports (spec §12: any comment reportable).
  const onReportComment = (comment: CommentView) => {
    Alert.alert('Report comment', 'Why are you reporting this comment?', [
      ...REPORT_REASONS.map(({ label, reason }) => ({
        text: label,
        onPress: () =>
          report.mutate(
            { reason, commentId: comment.id },
            {
              onSuccess: () =>
                Alert.alert('Thanks', 'Your report is in — we review every one.'),
              onError: () => Alert.alert('Report failed', 'Please try again.'),
            },
          ),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <ErrorBoundary screen="Comments">
      <CommentSheet
        comments={comments}
        isLoading={isLoading}
        hasError={!!error}
        isRefetching={isRefetching}
        onRetry={() => void refetch()}
        posterName={posterName}
        myInitial={(myProfile?.display_name || myProfile?.username || '?')
          .charAt(0)
          .toUpperCase()}
        onToggleLike={(comment) =>
          toggleLike.mutate({
            postId,
            commentId: comment.id,
            liked: comment.viewer_liked,
          })
        }
        onReport={onReportComment}
        viewerId={userId}
        onSend={async ({ body, parentThreadId, imageUri }) => {
          if (!userId) throw new Error('Not signed in');
          const mediaPath = imageUri
            ? await uploadCommentImage(userId, imageUri)
            : undefined;
          await addComment.mutateAsync({
            postId,
            body,
            parentId: parentThreadId,
            mediaPath,
          });
        }}
        onPickImage={pickCommentImage}
        onTakePhoto={takeCommentPhoto}
        onInputFocusChange={onInputFocusChange}
      />
    </ErrorBoundary>
  );
}
