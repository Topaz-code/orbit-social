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

      className={`rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-3.5 sm:p-4 shadow-sm mb-4 sm:mb-6 text-[#D9D0B8] ${
        className || ''
      }`}
    >
      {errorMessage && (
        <div className="mb-3 p-2.5 text-xs font-medium text-[#B87568] bg-[#B87568]/15 rounded-xl border border-[#B87568]/30 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-[#B87568] hover:opacity-80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2.5 sm:gap-3">
        <Avatar src={user.avatar_url} fallback={user.display_name} size="md" className="shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="What's on your mind?"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="border-none bg-transparent p-0 text-sm text-[#D9D0B8] focus-visible:ring-0 resize-none min-h-[60px] sm:min-h-[70px] placeholder:text-[#7F8B86]"
          />

          {/* Media Previews */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden bg-[#2B3940] border border-[#3A4B4D]">
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
            <div className="flex items-center gap-2 my-2 bg-[#2B3940] border border-[#3A4B4D] p-2 rounded-xl">
              <Link2 className="h-4 w-4 text-[#496D6B] shrink-0" />
              <input
                type="url"
                placeholder="Paste link URL (https://...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setLinkUrl('');
                  setShowLinkInput(false);
                }}
                className="text-[#7F8B86] hover:text-[#D9D0B8]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Action Row — Mobile Single Row Toolbar */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2.5 border-t border-[#3A4B4D] mt-1">
            <div className="flex items-center gap-1 min-w-0">
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
                title="Add photo or video"
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-[10px] text-xs font-semibold text-[#A8AAA0] hover:bg-[#2B3940] hover:text-[#D9D0B8] transition-colors"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-[#D0A56A]" /> : <Image className="h-4 w-4 text-[#71877B] shrink-0" />}
                <span className="hidden sm:inline">Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                title="Attach link"
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-[10px] text-xs font-semibold text-[#A8AAA0] hover:bg-[#2B3940] hover:text-[#D9D0B8] transition-colors"
              >
                <Link2 className="h-4 w-4 text-[#496D6B] shrink-0" />
                <span className="hidden sm:inline">Link</span>
              </button>

              {/* Visibility Selector */}
              <div className="flex items-center rounded-[8px] bg-[#2B3940] border border-[#3A4B4D] px-2 py-1 text-xs">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="bg-transparent text-xs font-medium text-[#D9D0B8] focus:outline-none cursor-pointer pr-0.5"
                >
                  <option value="public" className="bg-[#202A2D] text-[#D9D0B8]">Public</option>
                  <option value="friends" className="bg-[#202A2D] text-[#D9D0B8]">Friends</option>
                  <option value="private" className="bg-[#202A2D] text-[#D9D0B8]">Private</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreatePost}
              isLoading={isSubmitting || isUploading}
              disabled={(!contentText.trim() && mediaUrls.length === 0) || isUploading}
              size="sm"
              className="px-4 py-1.5 h-8 rounded-[10px] font-semibold shrink-0 text-xs shadow-xs bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779]"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

