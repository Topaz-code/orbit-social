import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { Image as ImageCompressor } from 'react-native-compressor';
import { decode } from 'base64-arraybuffer';

export async function uploadMedia(
  uri: string,
  bucket: 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups',
  userId: string,
  mediaType: 'image' | 'video'
): Promise<string> {
  // 1. Compress
  const compressedUri =
    mediaType === 'image'
      ? await ImageCompressor.compress(uri, {
          compressionMethod: 'auto',
          maxWidth: 1920,
          quality: 0.8,
        })
      : uri;

  // 2. Read file as base64
  const base64 = await FileSystem.readAsStringAsync(compressedUri, { encoding: 'base64' });
  const ext = uri.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}.${ext}`;

  // 3. Upload to Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, decode(base64), {
      contentType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
      upsert: false,
    });

  if (error) throw error;

  // 4. Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}
