/**
 * Web build of the push plumbing: a no-op. Push is native-only (spec §13 —
 * v1 ships iOS; web is a dev/QA vehicle), and expo-notifications' response
 * hooks throw on web. Metro picks this file for web automatically; native
 * resolves ./usePushNotifications.ts unchanged.
 */
export function usePushNotifications(
  _userId: string | undefined,
  _canNavigate: boolean,
): void {
  // no push on web
}
