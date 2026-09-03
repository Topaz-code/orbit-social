import { useState } from 'react';
import { uploadMedia } from '../lib/upload';
import { useAuthStore } from '../stores/authStore';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const user = useAuthStore(state => state.user);

  const upload = async (
    uri: string, 
    bucket: 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups', 
    mediaType: 'image' | 'video'
  ) => {
    if (!user) throw new Error('Must be logged in to upload');
    
    setIsUploading(true);
    try {
      const url = await uploadMedia(uri, bucket, user.id, mediaType);
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading };
}
