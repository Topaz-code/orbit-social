import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { API_BASE_URL } from './api';

export type UploadBucket = 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups';

export function formatUploadError(err: any): string {
  if (!err) return 'Unknown upload error';
  if (typeof err === 'string') return err;
  const parts = [
    err.message,
    err.error,
    err.error_description,
    err.statusCode,
    err.status,
    err.response?.data?.message,
    err.response?.data?.error,
  ]
    .filter((part) => part !== undefined && part !== null && part !== '')
    .map(String);
  if (parts.length) return [...new Set(parts)].join(' | ');
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isSupabaseConfigured() {
  return (
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
}

function guessExt(uri: string, mime?: string) {
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('webp')) return 'webp';
  if (mime?.includes('gif')) return 'gif';
  if (mime?.includes('heic')) return 'heic';
  if (mime?.includes('mp4') || mime?.includes('quicktime') || mime?.includes('video')) return 'mp4';
  const cleaned = (uri || '').split('?')[0];
  const ext = cleaned.split('.').pop()?.toLowerCase();
  if (ext && /^[a-z0-9]{2,5}$/.test(ext)) return ext;
  return 'jpg';
}

function mimeFromExt(ext: string, mediaType: 'image' | 'video') {
  if (mediaType === 'video') return 'video/mp4';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
  };
  return map[ext] || 'image/jpeg';
}

async function copyToCache(uri: string): Promise<string> {
  if (uri.startsWith('file://') && !uri.includes('content://')) {
    return uri;
  }
  const dest = `${FileSystem.cacheDirectory}orbit-upload-${Date.now()}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (copyErr) {
    console.warn('[Orbit] copyAsync failed, reading original URI', formatUploadError(copyErr));
    return uri;
  }
}

async function readFileAsBase64(uri: string): Promise<string> {
  const fileUri = await copyToCache(uri);
  const encoding = (FileSystem as any).EncodingType?.Base64 ?? 'base64';
  return FileSystem.readAsStringAsync(fileUri, { encoding });
}

async function uploadViaSupabase(
  arrayBuffer: ArrayBuffer,
  path: string,
  contentType: string,
  preferredBucket: string
): Promise<string> {
  const buckets = Array.from(new Set([preferredBucket, 'orbit-media', 'messages']));
  let lastError: any = null;

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(
        `[Orbit] Supabase storage error (bucket=${bucket}, path=${path}):`,
        error.message || formatUploadError(error),
        error
      );
      lastError = error;
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    if (publicUrl) return publicUrl;
  }

  throw lastError || new Error('Supabase upload failed with no public URL');
}

async function uploadViaApiFormData(
  uri: string,
  name: string,
  type: string,
  category: string
): Promise<string> {
  const formData = new FormData();
  formData.append('category', category);
  formData.append('file', {
    uri,
    name,
    type,
  } as any);

  const token = await SecureStore.getItemAsync('access_token');
  const url = `${API_BASE_URL}/upload?category=${encodeURIComponent(category)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    const msg = json?.message || `API upload failed (${res.status})`;
    console.error('[Orbit] API FormData upload error:', msg, json);
    throw new Error(msg);
  }
  if (!json?.data?.url) {
    throw new Error('API upload succeeded but no URL was returned');
  }
  return json.data.url as string;
}

export interface ChatMediaOptions {
  mimeType?: string;
  fileName?: string;
}

/**
 * Robust React Native chat attachment uploader.
 * Reads the local URI as base64, decodes to ArrayBuffer, then:
 *  1. Uploads to Supabase Storage when configured
 *  2. Falls back to Orbit API FormData `{ uri, name, type }`
 */
export async function uploadChatMedia(
  uri: string,
  userId: string,
  mediaType: 'image' | 'video' = 'image',
  options: ChatMediaOptions = {}
): Promise<string> {
  if (!uri) {
    throw new Error('No media URI provided');
  }

  const ext = guessExt(options.fileName || uri, options.mimeType);
  const contentType = options.mimeType || mimeFromExt(ext, mediaType);
  const fileName = options.fileName || `chat-${Date.now()}.${ext}`;
  const path = `messages/${userId}/${Date.now()}.${ext}`;

  try {
    const base64 = await readFileAsBase64(uri);
    const arrayBuffer = decode(base64);

    if (isSupabaseConfigured()) {
      try {
        return await uploadViaSupabase(arrayBuffer, path, contentType, 'orbit-media');
      } catch (supabaseErr) {
        console.error(
          '[Orbit] Supabase chat upload failed, falling back to API FormData:',
          formatUploadError(supabaseErr),
          supabaseErr
        );
      }
    } else {
      console.warn('[Orbit] Supabase is not configured; using API FormData upload for chat media');
    }
  } catch (readErr) {
    console.error('[Orbit] Failed to read chat media as base64:', formatUploadError(readErr), readErr);
  }

  return uploadViaApiFormData(uri, fileName, contentType, 'messages');
}

export async function uploadMedia(
  uri: string,
  bucket: UploadBucket,
  userId: string,
  mediaType: 'image' | 'video'
): Promise<string> {
  let workingUri = uri;

  if (mediaType === 'image') {
    try {
      workingUri = await ImageCompressor.compress(uri, {
        compressionMethod: 'auto',
        maxWidth: 1920,
        quality: 0.8,
      });
    } catch (compressErr) {
      console.warn('[Orbit] Image compression skipped:', formatUploadError(compressErr));
      workingUri = uri;
    }
  }

  if (bucket === 'messages') {
    return uploadChatMedia(workingUri, userId, mediaType);
  }

  const ext = guessExt(workingUri);
  const contentType = mimeFromExt(ext, mediaType);
  const path = `${bucket}/${userId}/${Date.now()}.${ext}`;
  const fileName = `${bucket}-${Date.now()}.${ext}`;

  try {
    const base64 = await readFileAsBase64(workingUri);
    const arrayBuffer = decode(base64);

    if (isSupabaseConfigured()) {
      try {
        return await uploadViaSupabase(arrayBuffer, path, contentType, bucket);
      } catch (supabaseErr) {
        console.error(
          '[Orbit] Supabase upload failed, falling back to API FormData:',
          formatUploadError(supabaseErr),
          supabaseErr
        );
      }
    }
  } catch (readErr) {
    console.error('[Orbit] Failed to read media as base64:', formatUploadError(readErr), readErr);
  }

  return uploadViaApiFormData(workingUri, fileName, contentType, bucket);
}
