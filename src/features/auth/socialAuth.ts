/**
 * Native Apple sign-in + browser-based Google OAuth (official Supabase Expo
 * patterns). Both require provider config in the Supabase dashboard — see
 * PROGRESS.md founder checklist.
 */
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

/** Thrown when the user backs out — callers should ignore it silently. */
export class AuthCancelled extends Error {
  constructor() {
    super('auth-cancelled');
  }
}

async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
}

/** Native Sign in with Apple → Supabase signInWithIdToken. iOS only. */
export async function signInWithApple(): Promise<void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') {
      throw new AuthCancelled();
    }
    throw e;
  }

  if (!credential.identityToken) {
    throw new Error('Apple returned no identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple provides the name only on FIRST sign-in — persist it now or lose it.
  const nameParts = [
    credential.fullName?.givenName,
    credential.fullName?.familyName,
  ].filter(Boolean);
  if (nameParts.length > 0) {
    await supabase.auth.updateUser({
      data: { full_name: nameParts.join(' ') },
    });
  }
}

/** Google OAuth via the system browser and deep-link redirect. */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new AuthCancelled();
  }
  if (result.type !== 'success') {
    throw new Error('Google sign-in did not complete.');
  }
  await createSessionFromUrl(result.url);
}
