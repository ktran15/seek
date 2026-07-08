import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { registerPushToken } from './registerPush';

/**
 * Foreground presentation: results arriving while the app is open show as a
 * quiet banner (no sound/badge) — the in-app Notifications screen is the
 * primary surface; the push is a pointer to it.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * The only routes push payloads may open (matches the urls produced by the
 * unit-tested builder in supabase/functions/_shared/push.ts). A payload is
 * data from the network — never navigate to an arbitrary string from it.
 */
const KNOWN_ROUTES = new Set(['/notifications', '/vote', '/challenge', '/add-friends']);

function routeFrom(
  response: Notifications.NotificationResponse,
): Href | null {
  const url: unknown = response.notification.request.content.data?.url;
  return typeof url === 'string' && KNOWN_ROUTES.has(url) ? (url as Href) : null;
}

/**
 * Push plumbing for the signed-in app (spec §13):
 * - registers this device's token whenever a user is signed in;
 * - routes notification taps (cold start included) to the target screen.
 *
 * `canNavigate` gates tap-routing on the protected routes being mounted
 * (signed in + onboarded) — a tap that lands earlier stays on the default
 * screen rather than crashing into a guarded route.
 */
export function usePushNotifications(
  userId: string | undefined,
  canNavigate: boolean,
): void {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (userId) {
      registerPushToken();
    }
  }, [userId]);

  useEffect(() => {
    if (!canNavigate || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;
    const route = routeFrom(lastResponse);
    if (route) {
      router.push(route);
    }
  }, [canNavigate, lastResponse, router]);
}
