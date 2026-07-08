import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Remote-push device registration (spec §13): obtain this device's Expo push
 * token and file it under the signed-in user via the register_push_token RPC
 * (SECURITY DEFINER — a device that switches accounts reassigns its row).
 *
 * Every precondition failure is a SILENT no-op — push is garnish, never a
 * blocker (spec §13 "degrade gracefully if denied"):
 * - Expo Go: remote push was removed from Expo Go in SDK 53 — a dev build is
 *   required. Local scheduled notifications still work without this module.
 * - No EAS projectId (founder hasn't run `eas init` yet): the token API
 *   can't be called at all.
 * - Notification permission not granted (onboarding step 1 asks once).
 */

function easProjectId(): string | null {
  const fromExtra = (
    Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined
  )?.eas?.projectId;
  const id = fromExtra ?? Constants.easConfig?.projectId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** True when this build can obtain an Expo push token at all. */
export function remotePushSupported(): boolean {
  return (
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    easProjectId() !== null
  );
}

/** This device's Expo push token, or null when unsupported/denied. */
async function deviceToken(): Promise<string | null> {
  if (!remotePushSupported()) return null;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return null;
  try {
    const projectId = easProjectId();
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    // Network failure fetching the token — the next app start retries.
    return null;
  }
}

/** Register this device for the signed-in user. Safe to call repeatedly. */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await deviceToken();
    if (!token) return;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: platform,
    });
    if (error) {
      console.warn('[push] token registration failed:', error.message);
    }
  } catch {
    // Best-effort only.
  }
}

/**
 * Deregister this device so a signed-out phone stops receiving pushes.
 * Must run BEFORE supabase.auth.signOut() — the RLS delete needs the session.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await deviceToken();
    if (!token) return;
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // Best-effort: a stale row only means a harmless push to a signed-out
    // device's lock screen until the next sign-in reassigns the token.
  }
}
