import { useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/features/auth/useSession';
import { CommentSheet } from '@/features/feed/CommentSheet';
import {
  pickCommentImage,
  takeCommentPhoto,
  uploadCommentImage,
} from '@/features/feed/commentMedia';
import {
  useAddComment,
  useComments,
  useToggleCommentLike,
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

  const { data: comments, isLoading, error, refetch, isRefetching } = useComments(postId);
  const addComment = useAddComment(userId);
  const toggleLike = useToggleCommentLike(userId);

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
      />
    </ErrorBoundary>
  );
}
