import { useState } from 'react';
import { api } from '../lib/api.js';

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    category: 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups' = 'posts'
  ) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('category', category);
    formData.append('file', file);

    try {
      const res = await api.post(`/upload?category=${category}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      setIsUploading(false);
      return res.data?.data as {
        url: string;
        filename: string;
        mimetype: string;
        size: number;
      };
    } catch (err: any) {
      setIsUploading(false);
      setError(err.response?.data?.message || 'Upload failed');
      throw err;
    }
  };

  const uploadMultipleFiles = async (
    files: File[],
    category: 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups' = 'posts'
  ) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('category', category);
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await api.post(`/upload/multiple?category=${category}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsUploading(false);
      return res.data?.data as Array<{
        url: string;
        filename: string;
        mimetype: string;
        size: number;
      }>;
    } catch (err: any) {
      setIsUploading(false);
      setError(err.response?.data?.message || 'Upload failed');
      throw err;
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    progress,
    error,
  };
}
