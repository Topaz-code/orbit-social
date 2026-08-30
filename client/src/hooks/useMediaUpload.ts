import { useState } from 'react';
import { api } from '../lib/api.js';
import { compressImage } from '../lib/imageCompressor.js';

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getCompressionSettings = (category: string) => {
    switch (category) {
      case 'avatars':
        return { maxWidth: 800, maxHeight: 800, quality: 0.85 };
      case 'covers':
        return { maxWidth: 1920, maxHeight: 1080, quality: 0.82 };
      case 'stories':
      case 'posts':
        return { maxWidth: 1600, maxHeight: 1600, quality: 0.82 };
      case 'messages':
        return { maxWidth: 1280, maxHeight: 1280, quality: 0.80 };
      default:
        return { maxWidth: 1600, maxHeight: 1600, quality: 0.82 };
    }
  };

  const uploadFile = async (
    file: File,
    category: 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'groups' = 'posts'
  ) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Automatically compress images client-side before upload
      const optimizedFile = await compressImage(file, getCompressionSettings(category));

      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', optimizedFile);

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

    try {
      // Compress all images in parallel
      const compressionSettings = getCompressionSettings(category);
      const optimizedFiles = await Promise.all(
        files.map((file) => compressImage(file, compressionSettings))
      );

      const formData = new FormData();
      formData.append('category', category);
      optimizedFiles.forEach((f) => formData.append('files', f));

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

