import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { Textarea } from '../ui/textarea.js';
import { Image, Video, Link2, Globe, Users, Lock, X, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../../lib/utils.js';

interface PostComposerProps {
  onPostCreated?: (newPost: any) => void;
  groupId?: string | null;
  className?: string;
  onClose?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  groupId = null,
  className,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { uploadMultipleFiles, isUploading } = useMediaUpload();

  const [contentText, setContentText] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErrorMessage(null);

    try {
      const uploaded = await uploadMultipleFiles(files, 'posts');
      const newUrls = uploaded.map((u) => u.url);
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Could not upload selected photos. Please try again.');
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentText.trim() && mediaUrls.length === 0) return;
    setErrorMessage(null);

    setIsSubmitting(true);
    try {
      const payload: any = {
        content_text: contentText.trim(),
        visibility,
        group_id: groupId,
      };

      if (mediaUrls.length === 1) {
        payload.media_url = mediaUrls[0];
      } else if (mediaUrls.length > 1) {
        payload.media_gallery = mediaUrls;
        payload.media_url = mediaUrls[0];
      }

      if (linkUrl.trim()) {
        payload.link_url = linkUrl.trim();
      }

      const res = await (await import('../../lib/api.js')).api.post('/posts', payload);
      if (res.data?.success) {
        setContentText('');
        setMediaUrls([]);
        setLinkUrl('');
        setShowLinkInput(false);
        setErrorMessage(null);
        if (onPostCreated) onPostCreated(res.data.data);
        if (onClose) onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Could not publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm mb-6 ${
        className || ''
      }`}
    >
      {errorMessage && (
        <div className="mb-3 p-2.5 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar src={user.avatar_url} fallback={user.display_name} size="md" />

        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="What's on your mind? (No algorithms, just pure thoughts)"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="border-none bg-transparent p-0 text-sm focus-visible:ring-0 resize-none min-h-[70px]"
          />

          {/* Media Previews */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-900">
                  <img src={getMediaUrl(url)} alt="Upload preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Link Input Bar */}
          {showLinkInput && (
            <div className="flex items-center gap-2 my-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
              <Link2 className="h-4 w-4 text-indigo-500" />
              <input
                type="url"
                placeholder="Paste link URL (https://...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setLinkUrl('');
                  setShowLinkInput(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*,video/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <Image className="h-4 w-4 text-emerald-500" />}
                <span className="hidden sm:inline">Photo/Video</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
              >
                <Link2 className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">Link</span>
              </button>

              {/* Visibility Selector */}
              <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 ml-1 text-xs">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Only Me</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreatePost}
              isLoading={isSubmitting || isUploading}
              disabled={(!contentText.trim() && mediaUrls.length === 0) || isUploading}
              size="sm"
              className="px-5"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
