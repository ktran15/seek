/**
 * Proof media upload (spec §7.4): captured media persists locally (the
 * capture components hand us file:// URIs in the app sandbox) and upload
 * retries until success — an upload failure NEVER burns the attempt.
 */
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

function extensionOf(uri: string): string {
  const match = /\.(\w+)(?:\?.*)?$/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

/**
 * Uploads one local file into the private proofs bucket under the owner's
 * folder (RLS: users write only their own folder). Returns the storage path.
 */
async function uploadOne(
  userId: string,
  challengeId: string,
  uri: string,
  index: number,
): Promise<string> {
  const ext = extensionOf(uri);
  const contentType = EXT_TO_MIME[ext] ?? 'application/octet-stream';
  const path = `${userId}/${challengeId}/${Date.now()}-${index}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from('proofs')
    .upload(path, decode(base64), { contentType, upsert: false });
  if (error) throw error;

  return path;
}

/**
 * Uploads all proof files; throws on the first failure (caller keeps the
 * local URIs and offers retry — spec: never burn an attempt on a network
 * error). Already-uploaded files in a retry are fine: paths are timestamped.
 */
export async function uploadProofs(
  userId: string,
  challengeId: string,
  uris: string[],
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    paths.push(await uploadOne(userId, challengeId, uris[i] as string, i));
  }
  return paths;
}
