import { useQuery } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { relationshipWith } from '@/features/friends/graph';
import { useMyFriendships, useSendFriendRequest } from '@/features/friends/useFriends';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

const MAX_SUGGESTIONS = 10;

/** Friends-of-friends as add suggestions (block-aware via the M3 RPC). */
function useSuggestions(enabled: boolean) {
  return useQuery({
    queryKey: ['friend-suggestions'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_fof_profiles');
      if (error) throw error;
      return data.slice(0, MAX_SUGGESTIONS);
    },
  });
}

/**
 * "Suggestions to add" woven into the Home feeds (spec §5, §11): a horizontal
 * strip of friends-of-friends with one-tap requests. Renders nothing when
 * there is no one to suggest.
 */
export function FriendSuggestions() {
  const { session } = useSession();
  const myId = session?.user.id;
  const { data: suggestions } = useSuggestions(!!myId);
  const { data: friendships } = useMyFriendships(myId);
  const sendRequest = useSendFriendRequest(myId);

  if (!myId || !suggestions || suggestions.length === 0) return null;

  return (
    <View style={[styles.card, elevation.card]}>
      <Text style={[textStyles.headerS, styles.title]}>Suggestions to add</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.strip}>
          {suggestions.map((profile) => {
            const rel = relationshipWith(friendships ?? [], myId, profile.id);
            const requested = rel !== 'none';
            return (
              <View key={profile.id} style={styles.tile}>
                <View style={styles.avatar}>
                  <Text style={[textStyles.headerS, styles.avatarLetter]}>
                    {(profile.username ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[textStyles.caption, styles.name]} numberOfLines={1}>
                  {profile.display_name ?? profile.username}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${profile.username}`}
                  disabled={requested || sendRequest.isPending}
                  onPress={() =>
                    sendRequest.mutate(profile.id, {
                      onError: (e) =>
                        Alert.alert(
                          'Request failed',
                          e instanceof Error ? e.message : 'Try again.',
                        ),
                    })
                  }
                  style={[styles.addButton, requested && styles.addButtonDone]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      textStyles.caption,
                      requested ? styles.addLabelDone : styles.addLabel,
                    ]}
                  >
                    {requested ? 'REQUESTED' : 'ADD'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  strip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    // Wide enough that the button's longest label ("REQUESTED", ~72px in
    // caption type) fits on one line after tile + button padding.
    width: 120,
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  name: {
    color: colors.textPrimary,
    maxWidth: 96,
  },
  addButton: {
    minHeight: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
  },
  addButtonDone: {
    backgroundColor: colors.surfaceSecondary,
  },
  addLabel: {
    color: colors.textOnPrimary,
  },
  addLabelDone: {
    color: colors.textSecondary,
  },
});
