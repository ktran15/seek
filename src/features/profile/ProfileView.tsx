import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
import { useFriendCount } from '@/features/friends/useFriends';
import { sendInvite } from '@/features/invites/sendInvite';
import { useProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

const SECTIONS = ['Stats', 'Badges', 'Inventory'] as const;
type Section = (typeof SECTIONS)[number];

export function ProfileView() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const friendCount = useFriendCount(userId);
  const { data: submissions } = useMySubmissions(userId);
  const completedCount = (submissions ?? []).filter(
    (s) => s.state === 'submitted',
  ).length;
  const [section, setSection] = useState<Section>('Stats');

  // LOCKED stat set (spec §11), all live as of M7.
  const { data: coinsEarned } = useCoinsEarned(userId);
  const { data: h2hRecord } = useH2HRecord(userId);
  const { data: crates } = useMyCrates(userId);
  const votesWon = (crates ?? []).filter((c) => c.source === 'vote_win').length;
  const { data: catalog } = useCosmeticsCatalog();

  const invite = async () => {
    if (!session) return;
    try {
      await sendInvite(session.user.id);
    } catch (e) {
      Alert.alert('Could not share', e instanceof Error ? e.message : 'Try again.');
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
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
        <AvatarPreview config={profile?.avatar_config ?? {}} cosmetics={catalog ?? []} />
        <Pressable
          accessibilityRole="button"
          onPress={invite}
          style={styles.counters}
        >
          <Text style={[textStyles.headerS, styles.inviteCounter]}>
            ＋{'\n'}Invite
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          style={styles.gear}
          hitSlop={4}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={[textStyles.headerL, styles.displayName]}>
        {profile?.display_name ?? '—'}
      </Text>
      <Text style={[textStyles.body, styles.username]}>
        @{profile?.username ?? '—'}
      </Text>

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

      <View style={styles.sectionTabs}>
        {SECTIONS.map((s) => {
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
              {h2hRecord ? `${h2hRecord.wins}-${h2hRecord.losses}` : '—'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>Votes won</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>{votesWon}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[textStyles.body, styles.statLabel]}>Coins earned</Text>
            <Text style={[textStyles.headerS, styles.statValueLive]}>
              {coinsEarned ?? '—'}
            </Text>
          </View>
        </View>
      )}
      {section === 'Badges' && (
        <View style={styles.sectionBody}>
          <View style={styles.badgeGrid}>
            {['Summit Reached', 'First Win', 'Vote Winner', 'Perfect Week'].map(
              (badge) => (
                <View key={badge} style={styles.badgeCell}>
                  <View style={styles.badgeCircle} />
                  <Text style={[textStyles.caption, styles.badgeLabel]}>
                    {badge}
                  </Text>
                </View>
              ),
            )}
          </View>
          <Text style={[textStyles.caption, styles.sectionNote]}>
            Badges unlock for real once challenges run (M4+).
          </Text>
        </View>
      )}
      {section === 'Inventory' && (
        <View style={styles.sectionBody}>
          <InventorySection userId={userId} />
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
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.6,
  },
  badgeLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionNote: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
