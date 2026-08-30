import React, { useState, useRef } from 'react';
import { useStories } from '../../hooks/useStories.js';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.js';
import { Upload, Type, Palette, Clock, Check, X, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../../lib/utils.js';

interface StoryUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StoryUploadModal: React.FC<StoryUploadModalProps> = ({ open, onOpenChange }) => {
  const { createStory, isCreating } = useStories();
  const { uploadFile, isUploading } = useMediaUpload();

  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [overlayColor, setOverlayColor] = useState('#ffffff');
  const [overlayBg, setOverlayBg] = useState('rgba(0,0,0,0.6)');
  const [overlayPos, setOverlayPos] = useState<'top' | 'center' | 'bottom'>('center');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = ['#ffffff', '#f43f5e', '#06b6d4', '#22c55e', '#eab308', '#a855f7'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    try {
      const res = await uploadFile(file, 'stories');
      setMediaUrl(res.url);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to upload photo. Please check your connection.');
    }
  };

  const handlePublishStory = async () => {
    if (!mediaUrl) return;
    setErrorMessage(null);

    try {
      await createStory({
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption.trim() || undefined,
        text_overlay: overlayText.trim()
          ? {
              text: overlayText.trim(),
              color: overlayColor,
              bgColor: overlayBg,
              position: overlayPos,
            }
          : undefined,
      });

      // Reset
      setMediaUrl('');
      setCaption('');
      setOverlayText('');
      setErrorMessage(null);
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Could not publish your story. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span>Create 24h Story</span>
          <span className="flex items-center gap-1 text-[11px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3 text-amber-500" /> Auto-expires in 24h
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {/* Upload Drop Area or Preview */}
        {!mediaUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors p-4 text-center"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-500">Uploading media...</p>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 mb-3 shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Select Photo or Video
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, MP4, WEBM</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative h-72 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
            {mediaType === 'video' ? (
              <video src={getMediaUrl(mediaUrl)} controls className="h-full w-full object-contain" />
            ) : (
              <img src={getMediaUrl(mediaUrl)} alt="Preview" className="h-full w-full object-contain" />
            )}

            {/* Live Text Overlay Preview */}
            {overlayText && (
              <div
                className="absolute z-20 px-3 py-1.5 rounded-xl text-center max-w-[85%] font-bold text-base shadow"
                style={{
                  color: overlayColor,
                  backgroundColor: overlayBg,
                  top: overlayPos === 'top' ? '15%' : overlayPos === 'bottom' ? '75%' : '45%',
                }}
              >
                {overlayText}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMediaUrl('')}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Text Overlay Controls */}
        {mediaUrl && (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Text Overlay (Optional)
              </label>
              <Input
                type="text"
                placeholder="Add text over your story..."
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                icon={<Type className="h-4 w-4" />}
              />
            </div>

            {overlayText && (
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Position */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-1 text-[11px]">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setOverlayPos(pos)}
                      className={`px-2 py-1 rounded capitalize font-medium ${
                        overlayPos === pos
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setOverlayColor(c)}
                      className={`h-5 w-5 rounded-full border border-white/40 shadow-sm ${
                        overlayColor === c ? 'ring-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Caption
              </label>
              <Input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handlePublishStory} isLoading={isCreating} disabled={!mediaUrl || isUploading}>
          Publish Story
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
