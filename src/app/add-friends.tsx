import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormTextInput } from '@/components/ui/FormTextInput';
import { useSession } from '@/features/auth/useSession';
import { relationshipWith, type Relationship } from '@/features/friends/graph';
import {
  useMyFriendships,
  useSearchProfiles,
  useSendFriendRequest,
} from '@/features/friends/useFriends';
import { sendInvite } from '@/features/invites/sendInvite';
import { colors, radii, spacing, textStyles } from '@/theme';

const ACTION_LABELS: Record<Relationship, string> = {
  none: 'ADD',
  outgoing: 'REQUESTED',
  incoming: 'RESPOND IN 🔔',
  friends: 'FRIENDS',
  declined: 'REQUESTED', // declined is silent for the requester (no re-spam)
};

export default function AddFriendsScreen() {
  const { session } = useSession();
  const myId = session?.user.id;
  const [term, setTerm] = useState('');

  const { data: results, isFetching } = useSearchProfiles(term);
  const { data: friendships } = useMyFriendships(myId);
  const sendRequest = useSendFriendRequest(myId);

  const invite = async () => {
    if (!myId) return;
    try {
      await sendInvite(myId);
    } catch (e) {
      Alert.alert('Could not share', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const onAdd = (addresseeId: string) => {
    sendRequest.mutate(addresseeId, {
      onError: (e) =>
        Alert.alert(
          'Request failed',
          e instanceof Error ? e.message : 'Try again.',
        ),
    });
  };

  return (
    <ErrorBoundary screen="Add Friends">
      <View style={styles.container}>
        <FormTextInput
          label="Find friends by username"
          value={term}
          onChangeText={setTerm}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="trail_blazer"
        />

        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[textStyles.bodySmall, styles.empty]}>
              {term.trim().length < 2
                ? 'Type at least 2 characters to search.'
                : isFetching
                  ? 'Searching…'
                  : 'No one found with that username.'}
            </Text>
          }
          ListFooterComponent={
            <View style={styles.inviteCard}>
              <Text style={[textStyles.headerS, styles.inviteTitle]}>
                Invite friends
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share an invite"
                onPress={invite}
                style={styles.inviteShare}
              >
                <Ionicons name="share-outline" size={20} color={colors.textOnPrimary} />
                <Text style={[textStyles.caption, styles.inviteShareLabel]}>
                  SHARE
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const rel = myId
              ? relationshipWith(friendships ?? [], myId, item.id)
              : 'none';
            const actionable = rel === 'none';
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={[textStyles.headerS, styles.avatarLetter]}>
                    {(item.username ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={[textStyles.bodyEmphasis, styles.name]}>
                    {item.display_name ?? item.username}
                  </Text>
                  <Text style={[textStyles.caption, styles.username]}>
                    @{item.username}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${ACTION_LABELS[rel]} ${item.username}`}
                  disabled={!actionable || sendRequest.isPending}
                  onPress={() => onAdd(item.id)}
                  style={[styles.action, !actionable && styles.actionDisabled]}
                >
                  <Text
                    style={[
                      textStyles.caption,
                      actionable ? styles.actionLabel : styles.actionLabelDisabled,
                    ]}
                  >
                    {ACTION_LABELS[rel]}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  list: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
  },
  username: {
    color: colors.textSecondary,
  },
  action: {
    minHeight: 44,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  actionDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  actionLabel: {
    color: colors.textOnPrimary,
  },
  actionLabelDisabled: {
    color: colors.textSecondary,
  },
  inviteCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inviteTitle: {
    color: colors.textPrimary,
  },
  inviteShare: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  inviteShareLabel: {
    color: colors.textOnPrimary,
  },
});
