import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getAsset } from '@/assets/registry';

import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { AvatarPreview } from '@/features/avatar/AvatarPreview';
import { useMySubmissions } from '@/features/challenge/useChallenge';
import { InventorySection } from '@/features/economy/InventorySection';
import {
  useCoinsEarned,
  useCosmeticsCatalog,
  useH2HRecord,
  useMyCrates,
} from '@/features/economy/useEconomy';
import { relationshipWith, type Relationship } from '@/features/friends/graph';
import {
  useFriendCount,
  useMyFriendships,
  useSendFriendRequest,
} from '@/features/friends/useFriends';
import { sendInvite } from '@/features/invites/sendInvite';
import { deriveBadges } from '@/features/profile/badges';
import { useBadges } from '@/features/profile/useBadges';
import { useProfile } from '@/features/profile/useProfile';
import { usePublicProfileStats } from '@/features/profile/usePublicProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

const SECTIONS = ['Stats', 'Badges', 'Inventory'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Friend-request control per relationship state (mirrors the Add Friends
 * action states): outgoing AND declined read REQUESTED (silent decline — no
 * re-request in v1); incoming points at Notifications, which owns
 * accept/decline — this screen never shows an inline accept.
 */
const FRIEND_ACTIONS: Record<Relationship, { label: string; sendable: boolean }> = {
  none: { label: 'ADD FRIEND', sendable: true },
  outgoing: { label: 'REQUESTED', sendable: false },
  declined: { label: 'REQUESTED', sendable: false },
  incoming: { label: 'RESPOND IN 🔔', sendable: false },
  friends: { label: 'FRIENDS', sendable: false },
};

/**
 * The Profile screen (spec §5, §11). With `viewUserId` it renders the same
 * screen as a read-only view of ANOTHER user (founder-directed, 2026-07-10):
 * avatar, names, badges, and the LOCKED §11 stat set — all public via the
 * block-aware stats RPC — with a friend-request control in place of the
 * self-management surfaces (Settings, Invite, Share, Inventory).
 */
export function ProfileView({ viewUserId }: { viewUserId?: string } = {}) {
  const { session } = useSession();
  const myId = session?.user.id;
  const isSelf = !viewUserId || viewUserId === myId;
  const targetId = viewUserId ?? myId;
  /** Gates every own-data hook off in the read-only view of someone else. */
  const selfId = isSelf ? myId : undefined;

  const { data: profile, isLoading: profileLoading } = useProfile(targetId);
  const friendCount = useFriendCount(selfId);
  const { data: submissions } = useMySubmissions(selfId);
  const [section, setSection] = useState<Section>('Stats');

  // LOCKED stat set (spec §11): own rows under RLS for the self view, the
  // SECURITY DEFINER RPC (same definitions server-side) for anyone else.
  const { data: coinsEarned } = useCoinsEarned(selfId);
  const { data: h2hRecord } = useH2HRecord(selfId);
  const { data: crates } = useMyCrates(selfId);
  const { data: catalog } = useCosmeticsCatalog();
  const ownBadges = useBadges(selfId);
  const { data: publicStats, isLoading: statsLoading } = usePublicProfileStats(
    isSelf ? undefined : targetId,
  );

  const { data: friendships } = useMyFriendships(myId);
  const sendRequest = useSendFriendRequest(myId);

  const completedCount = isSelf
    ? (submissions ?? []).filter((s) => s.state === 'submitted').length
    : (publicStats?.submittedDays.length ?? 0);
  const record = isSelf
    ? h2hRecord
    : publicStats
      ? { wins: publicStats.h2hWins, losses: publicStats.h2hLosses }
      : undefined;
  const votesWon = isSelf
    ? (crates ?? []).filter((c) => c.source === 'vote_win').length
    : (publicStats?.votesWon ?? 0);
  const coins = isSelf ? coinsEarned : publicStats?.coinsEarned;
  const badges = isSelf
    ? ownBadges
    : deriveBadges({
        submittedDays: new Set(publicStats?.submittedDays ?? []),
        lengthDays: config.beta.lengthDays,
        h2hWins: publicStats?.h2hWins ?? 0,
        voteFirsts: publicStats?.voteFirsts ?? 0,
      });
  const sections: readonly Section[] = isSelf ? SECTIONS : ['Stats', 'Badges'];

  const invite = async () => {
    if (!session) return;
    try {
      await sendInvite(session.user.id);
    } catch (e) {
      Alert.alert('Could not share', e instanceof Error ? e.message : 'Try again.');
    }
  };

  if (!isSelf) {
    if (profileLoading || statsLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      );
    }
    if (!profile) {
      return (
        <View style={styles.centerState}>
          <Text style={[textStyles.headerL, styles.stateTitle]}>
            This climber is gone
          </Text>
          <Text style={[textStyles.body, styles.stateCopy]}>
            The account may have been deleted.
          </Text>
        </View>
      );
    }
    // Profile row exists but the block-aware stats RPC returned nothing:
    // a blocked pair (either direction). Feeds already exclude blocked
    // users, so this is the race-condition fallback — never stale numbers.
    if (!publicStats) {
      return (
        <View style={styles.centerState}>
          <Text style={[textStyles.headerL, styles.stateTitle]}>
            Profile unavailable
          </Text>
          <Text style={[textStyles.body, styles.stateCopy]}>
            This profile can’t be viewed.
          </Text>
        </View>
      );
    }
  }

  const action =
    FRIEND_ACTIONS[
      myId && targetId ? relationshipWith(friendships ?? [], myId, targetId) : 'none'
    ];
  const onAddFriend = () => {
    if (!targetId) return;
    sendRequest.mutate(targetId, {
      onError: (e) =>
        Alert.alert('Request failed', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        {isSelf && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Friends: ${friendCount}. Open friends list`}
            onPress={() => router.push('/friends')}
            style={styles.counters}
          >
            <Text style={[textStyles.headerS, styles.counter]}>
              {friendCount}
              {'\n'}Friends
            </Text>
          </Pressable>
        )}
        <AvatarPreview config={profile?.avatar_config ?? {}} cosmetics={catalog ?? []} />
        {isSelf && (
          <Pressable
            accessibilityRole="button"
            onPress={invite}
            style={styles.counters}
          >
            <Text style={[textStyles.headerS, styles.inviteCounter]}>
              ＋{'\n'}Invite
            </Text>
          </Pressable>
        )}
        {isSelf && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            style={styles.gear}
            hitSlop={4}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <Text style={[textStyles.headerL, styles.displayName]}>
        {profile?.display_name ?? '—'}
      </Text>
      <Text style={[textStyles.body, styles.username]}>
        @{profile?.username ?? '—'}
      </Text>

      {isSelf ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Share Profile', 'Profile deep links land in M3.')}
          style={styles.shareButton}
        >
          <Ionicons name="share-outline" size={18} color={colors.info} />
          <Text style={[textStyles.bodyEmphasis, styles.shareLabel]}>
            Share Profile
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label}: ${profile?.username ?? 'user'}`}
          accessibilityState={{ disabled: !action.sendable }}
          disabled={!action.sendable || sendRequest.isPending}
          onPress={onAddFriend}
          style={[styles.friendAction, !action.sendable && styles.friendActionDone]}
        >
          <Text
            style={[
              textStyles.headerS,
              action.sendable ? styles.friendActionLabel : styles.friendActionLabelDone,
            ]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </Pressable>
      )}

      <View style={styles.sectionTabs}>
        {sections.map((s) => {
          const active = s === section;
          return (
            <Pressable
              key={s}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setSection(s)}
              style={[styles.sectionTab, active && styles.sectionTabActive]}
            >
              <Text
                style={[
                  textStyles.headerS,
                  active ? styles.sectionLabelActive : styles.sectionLabel,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {section === 'Stats' && (
        <View style={styles.sectionBody}>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>Stops climbed</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>
              {completedCount}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>
              Challenges completed
            </Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>
              {completedCount}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>H2H record (W-L)</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>
              {record ? `${record.wins}-${record.losses}` : '—'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>Votes won</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>{votesWon}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>Coins earned</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>
              {coins ?? '—'}
            </Text>
          </View>
        </View>
      )}
      {section === 'Badges' && (
        <View style={styles.sectionBody}>
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeCell}>
                <Image
                  source={getAsset(badge.slot)}
                  style={[styles.badgeArt, !badge.earned && styles.badgeLocked]}
                  resizeMode="contain"
                  accessibilityLabel={`${badge.name}${badge.earned ? '' : ' (locked)'}`}
                />
                <Text style={[textStyles.caption, styles.badgeLabel]}>
                  {badge.name}
                </Text>
                {!badge.earned && (
                  <Text style={[textStyles.caption, styles.badgeHint]}>
                    {badge.hint}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <Text style={[textStyles.caption, styles.sectionNote]}>
            {badges.filter((b) => b.earned).length} of {badges.length} earned
          </Text>
        </View>
      )}
      {isSelf && section === 'Inventory' && (
        <View style={styles.sectionBody}>
          <InventorySection userId={selfId} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  counters: {
    width: 72,
  },
  counter: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inviteCounter: {
    color: colors.info,
    textAlign: 'center',
  },
  gear: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  username: {
    color: colors.textSecondary,
  },
  shareButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  shareLabel: {
    color: colors.info,
  },
  // Friend-request pill (view-another-user mode) — same pill language as the
  // Add Friends row actions, at profile-CTA scale.
  friendAction: {
    minHeight: 44,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  friendActionDone: {
    backgroundColor: colors.surfaceSecondary,
  },
  friendActionLabel: {
    color: colors.textOnPrimary,
  },
  friendActionLabelDone: {
    color: colors.textSecondary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  stateTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateCopy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTabs: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  sectionTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  sectionTabActive: {
    backgroundColor: colors.primary,
  },
  sectionLabel: {
    color: colors.textSecondary,
  },
  sectionLabelActive: {
    color: colors.textOnPrimary,
  },
  sectionBody: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  statRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
  },
  statLabel: {
    color: colors.textPrimary,
  },
  statValue: {
    color: colors.textSecondary,
  },
  statValueLive: {
    color: colors.textPrimary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  badgeCell: {
    alignItems: 'center',
    gap: spacing.xxs,
    width: 96,
  },
  badgeArt: {
    width: 72,
    height: 72,
  },
  badgeLocked: {
    opacity: 0.22,
  },
  badgeLabel: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeHint: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionNote: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
