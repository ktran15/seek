import { StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { useChallengeByDay, useMySubmissions } from '@/features/challenge/useChallenge';
import { useProfilesById } from '@/features/friends/useFriends';
import { currentBetaDay } from '@/lib/betaCalendar';
import { colors, radii, spacing, textStyles } from '@/theme';

import { useMyMatch } from './useH2H';

/**
 * Today's head-to-head state on the Challenge screen (spec §7.6): pending
 * ("waiting for a rival") or resolved (win/loss vs friend or mascot).
 * Renders nothing when today isn't an H2H day for this user.
 */
export function H2HStatusCard() {
  const { session } = useSession();
  const userId = session?.user.id;
  const today = currentBetaDay();

  const challenge = useChallengeByDay(today);
  const { data: submissions } = useMySubmissions(userId);
  const { data: match } = useMyMatch(userId, today);

  const opponentIds = match?.opponent_id ? [match.opponent_id] : [];
  const { data: opponents } = useProfilesById(opponentIds);

  if (!challenge || !userId) return null;

  const mySub = submissions?.find(
    (s) => s.beta_day === today && s.state === 'submitted',
  );
  if (!mySub) return null;

  const isH2H =
    challenge.mode === 'H2H' ||
    (challenge.has_difficulty && mySub.difficulty === 'hard');
  if (!isH2H) return null;

  let line: string;
  let won: boolean | null = null;

  if (!match || match.status === 'pending') {
    line = 'Rival search — pairing you with a friend. The mascot steps in at day close if no one shows.';
  } else if (match.vs_mascot) {
    won = match.winner_user_id === userId;
    line = won
      ? `You beat ${config.mascot.name}!`
      : `${config.mascot.name} got you this time.`;
  } else {
    const opponent = opponents?.find((o) => o.id === match.opponent_id);
    const name = opponent?.display_name ?? opponent?.username ?? 'your rival';
    won = match.winner_user_id === userId;
    line = won ? `You beat ${name}!` : `${name} beat you this time.`;
  }

  return (
    <View
      style={[
        styles.card,
        won === true && styles.cardWin,
        won === false && styles.cardLoss,
      ]}
    >
      <Text style={[textStyles.headerS, styles.title]}>
        {won === null ? 'HEAD-TO-HEAD' : won ? 'H2H — VICTORY' : 'H2H — DEFEAT'}
      </Text>
      <Text style={[textStyles.bodySmall, styles.line]}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    gap: spacing.xxs,
  },
  cardWin: {
    backgroundColor: colors.surfaceSecondary,
  },
  cardLoss: {
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  line: {
    color: colors.textPrimary,
  },
});
