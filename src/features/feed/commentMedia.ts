/**
 * Comment image replies (M6.1): pick from the photo gallery or take a photo,
 * then upload into the private comment-media bucket under the owner's folder
 * (RLS mirrors the proofs bucket; friends see it via the comments Edge
 * Function's signed URLs).
 */
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const IMAGE_QUALITY = 0.7;

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
};

function extensionOf(uri: string): string {
  const match = /\.(\w+)(?:\?.*)?$/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

/**
 * Gallery pick. Returns a local URI, null if the user cancels; throws with a
 * friendly message when permission is denied (caller alerts).
 */
export async function pickCommentImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access in Settings to reply with an image.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: IMAGE_QUALITY,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/**
 * Camera capture via the system camera (shoot → retake/use photo built in;
 * closing out cancels). Same contract as pickCommentImage.
 */
export async function takeCommentPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow camera access in Settings to reply with a photo.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: IMAGE_QUALITY,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/** Uploads the local image; returns its storage path for the comment row. */
export async function uploadCommentImage(userId: string, uri: string): Promise<string> {
  const ext = extensionOf(uri);
  const contentType = EXT_TO_MIME[ext] ?? 'image/jpeg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from('comment-media')
    .upload(path, decode(base64), { contentType, upsert: false });
  if (error) throw error;

  return path;
}
