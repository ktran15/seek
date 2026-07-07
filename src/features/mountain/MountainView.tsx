import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getAsset } from '@/assets/registry';
import { colors, radii, spacing, textStyles } from '@/theme';

import {
  START_FLAG_POSITION,
  STOP_POSITIONS,
  type StopState,
} from './stops';

const STOP_SIZE = 52;

/**
 * M2 skeleton: mock progression (days 1–2 completed, day 3 current) so all
 * stop states render. The real global-calendar state machine lands in M4.
 */
const MOCK_CURRENT_DAY = 3;

function mockStateFor(day: number): StopState {
  if (day < MOCK_CURRENT_DAY) return 'completed';
  if (day === MOCK_CURRENT_DAY) return 'current';
  return 'locked';
}

/** The 7-stop mountain (spec §5, §8) over registry art slots. */
export function MountainView() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const onStopPress = (day: number, state: StopState) => {
    if (state === 'current') {
      Alert.alert(`Day ${day}`, 'The challenge flow lands in M4.');
    } else if (state === 'locked') {
      Alert.alert('Locked', 'Future days unlock on their date.');
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ImageBackground
        source={getAsset('mountainBackground')}
        style={styles.mountain}
        imageStyle={styles.mountainImage}
      >
        {size.width > 0 && (
          <>
            <Image
              source={getAsset('flagStart')}
              style={[
                styles.startFlag,
                {
                  left: START_FLAG_POSITION.x * size.width - 16,
                  top: START_FLAG_POSITION.y * size.height - 16,
                },
              ]}
              accessibilityLabel="Start flag"
            />
            {STOP_POSITIONS.map(({ day, x, y }) => {
              const state = mockStateFor(day);
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${day} stop, ${state}`}
                  onPress={() => onStopPress(day, state)}
                  style={[
                    styles.stop,
                    {
                      left: x * size.width - STOP_SIZE / 2,
                      top: y * size.height - STOP_SIZE / 2,
                    },
                    stopStyles[state],
                  ]}
                >
                  {state === 'completed' ? (
                    <Image
                      source={getAsset('flagPlanted')}
                      style={styles.stopImage}
                    />
                  ) : state === 'current' ? (
                    <Image
                      source={getAsset('hikerBase')}
                      style={styles.stopImage}
                      accessibilityLabel="Your avatar"
                    />
                  ) : (
                    <Text style={[textStyles.headerS, styles.lockedText]}>
                      {day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: spacing.md,
  },
  mountain: {
    flex: 1,
  },
  mountainImage: {
    borderRadius: radii.card,
  },
  startFlag: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  stop: {
    position: 'absolute',
    width: STOP_SIZE,
    height: STOP_SIZE,
    borderRadius: STOP_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  stopImage: {
    width: STOP_SIZE - 14,
    height: STOP_SIZE - 14,
    borderRadius: (STOP_SIZE - 14) / 2,
  },
  lockedText: {
    color: colors.textOnDark,
  },
});

const stopStyles: Record<StopState, object> = {
  completed: {
    backgroundColor: colors.celebration,
    borderColor: colors.primary,
  },
  current: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    transform: [{ scale: 1.15 }],
  },
  locked: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.surfaceSecondary,
    opacity: 0.55,
  },
  missed: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.surfaceSecondary,
    opacity: 0.35,
  },
};
