import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraType,
} from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressButton } from '@/components/ui/PressButton';
import { colors, radii, spacing, textStyles } from '@/theme';

export interface CameraResult {
  uri: string;
  /** Elapsed recording seconds (video only). */
  seconds?: number;
}

interface CameraCaptureProps {
  kind: 'photo' | 'video';
  /** Auto-stop cap in seconds (spec §7.5); null = manual stop only. */
  capSeconds: number | null;
  /** Clock display: count 'up' (day 1 chug) or 'down' (day 4 shot clock). */
  clockDirection: 'up' | 'down' | null;
  onCaptured: (result: CameraResult) => void;
  onCancel: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Camera proof capture. For video, the recording IS the timer (spec §7.5,
 * LOCKED): the big clock starts with the recording, overlays the camera view,
 * and auto-stop at the cap submits cap seconds as the score.
 */
export function CameraCapture({
  kind,
  capSeconds,
  clockDirection,
  onCaptured,
  onCancel,
}: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(0);

  const needsMic = kind === 'video';

  useEffect(() => {
    if (!cameraPermission?.granted) void requestCamera();
    if (needsMic && !micPermission?.granted) void requestMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [recording]);

  if (!cameraPermission?.granted || (needsMic && !micPermission?.granted)) {
    return (
      <View style={styles.permissionBox}>
        <Text style={[textStyles.body, styles.permissionText]}>
          Seek needs the camera{needsMic ? ' and microphone' : ''} to capture
          your proof.
        </Text>
        <PressButton
          label="GRANT ACCESS"
          onPress={() => {
            void requestCamera();
            if (needsMic) void requestMic();
          }}
        />
        <PressButton label="BACK" variant="info" onPress={onCancel} />
      </View>
    );
  }

  const takePhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (photo?.uri) onCaptured({ uri: photo.uri });
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (recording || busy) return;
    setRecording(true);
    startedAt.current = Date.now();
    setElapsed(0);
    try {
      // recordAsync resolves on stopRecording() OR when maxDuration hits —
      // the auto-stop path needs no extra handling (spec §7.5).
      const video = await cameraRef.current?.recordAsync({
        maxDuration: capSeconds ?? undefined,
      });
      const seconds = Math.min(
        Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
        capSeconds ?? Number.MAX_SAFE_INTEGER,
      );
      if (video?.uri) onCaptured({ uri: video.uri, seconds });
    } finally {
      setRecording(false);
    }
  };

  const clockValue =
    clockDirection === 'down' && capSeconds !== null
      ? Math.max(0, capSeconds - elapsed)
      : elapsed;

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={kind === 'video' ? 'video' : 'picture'}
      >
        {kind === 'video' && recording && (
          <View
            style={[styles.clockWrap, { top: insets.top + spacing.md }]}
            pointerEvents="none"
          >
            <Text style={[textStyles.timer, styles.clock]}>
              {formatClock(clockValue)}
            </Text>
          </View>
        )}
        {!recording && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            style={[styles.flip, { top: insets.top + spacing.sm }]}
          >
            <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
          </Pressable>
        )}
      </CameraView>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.md }]}>
        {kind === 'photo' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={takePhoto}
            disabled={busy}
            style={styles.shutter}
          />
        ) : recording ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            onPress={() => cameraRef.current?.stopRecording()}
            style={[styles.shutter, styles.shutterRecording]}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={startRecording}
            style={styles.shutter}
          >
            <View style={styles.recordDot} />
          </Pressable>
        )}
        {!recording && (
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}>
            <Text style={[textStyles.bodyEmphasis, styles.cancelText]}>Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  camera: {
    flex: 1,
  },
  clockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flip: {
    position: 'absolute',
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  controls: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRecording: {
    backgroundColor: colors.danger,
  },
  recordDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: radii.sm / 2,
    backgroundColor: '#FFFFFF',
  },
  cancel: {
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textOnDark,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  permissionText: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
