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
import { useProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

const SECTIONS = ['Stats', 'Badges', 'Inventory'] as const;
type Section = (typeof SECTIONS)[number];

/** LOCKED stat set (spec §11); real values wire up in M4–M9. */
const STAT_ROWS = [
  'Stops climbed',
  'H2H record (W-L)',
  'Votes won',
  'Challenges completed',
  'Coins earned',
];

export function ProfileView() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const [section, setSection] = useState<Section>('Stats');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.counters}>
          <Text style={[textStyles.headerS, styles.counter]}>0{'\n'}Followers</Text>
        </View>
        <AvatarPreview config={profile?.avatar_config ?? {}} />
        <View style={styles.counters}>
          <Text style={[textStyles.headerS, styles.counter]}>0{'\n'}Following</Text>
        </View>
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
          {STAT_ROWS.map((stat) => (
            <View key={stat} style={styles.statRow}>
              <Text style={[textStyles.body, styles.statLabel]}>{stat}</Text>
              <Text style={[textStyles.headerS, styles.statValue]}>—</Text>
            </View>
          ))}
          <Text style={[textStyles.caption, styles.sectionNote]}>
            Stats wire up as their systems land (M4–M9).
          </Text>
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
          <Text style={[textStyles.body, styles.emptyInventory]}>
            Unopened crates and your cosmetics live here.
          </Text>
          <Text style={[textStyles.caption, styles.sectionNote]}>
            Crate opening (M7) and cosmetic equip (M8) land here.
          </Text>
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
  emptyInventory: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sectionNote: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
