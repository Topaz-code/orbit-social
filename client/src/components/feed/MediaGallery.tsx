import React, { useState } from 'react';
import { getMediaUrl } from '../../lib/utils.js';
import { Dialog } from '../ui/dialog.js';

interface MediaGalleryProps {
  mediaUrl?: string;
  mediaType?: string;
  mediaGallery?: string[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaUrl,
  mediaType,
  mediaGallery = [],
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages: string[] = [];
  if (mediaUrl && mediaType !== 'video') {
    allImages.push(mediaUrl);
  }
  if (mediaGallery && mediaGallery.length > 0) {
    mediaGallery.forEach((url) => {
      if (!allImages.includes(url)) allImages.push(url);
    });
  }

  // Single video player
  if (mediaType === 'video' || (mediaUrl && /\.(mp4|webm|mov)$/i.test(mediaUrl))) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl bg-black aspect-video max-h-[480px]">
        <video
          src={getMediaUrl(mediaUrl)}
          controls
          className="h-full w-full object-contain"
          preload="metadata"
        />
      </div>
    );
  }

  if (allImages.length === 0) return null;

  if (allImages.length === 1) {
    return (
      <>
        <div
          onClick={() => setSelectedImage(allImages[0])}
          className="mt-3 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 cursor-pointer max-h-[520px] group"
        >
          <img
            src={getMediaUrl(allImages[0])}
            alt="Post media"
            className="w-full h-full object-cover max-h-[520px] group-hover:scale-[1.01] transition-transform duration-200"
            loading="lazy"
          />
        </div>

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)} className="max-w-4xl p-2 bg-black/90 border-none">
          {selectedImage && (
            <img
              src={getMediaUrl(selectedImage)}
              alt="Full view"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
            />
          )}
        </Dialog>
      </>
    );
  }

  // Grid layout for 2 or more images
  const displayCount = Math.min(allImages.length, 4);
  const remaining = allImages.length - 4;

  return (
    <>
      <div
        className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${
          displayCount === 2
            ? 'grid-cols-2 h-72'
            : displayCount === 3
            ? 'grid-cols-2 h-80'
            : 'grid-cols-2 h-80'
        }`}
      >
        {allImages.slice(0, 4).map((url, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedImage(url)}
            className={`relative overflow-hidden bg-slate-900 cursor-pointer group ${
              displayCount === 3 && idx === 0 ? 'row-span-2' : ''
            }`}
          >
            <img
              src={getMediaUrl(url)}
              alt={`Gallery item ${idx + 1}`}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            {idx === 3 && remaining > 0 && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white text-xl font-bold">
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)} className="max-w-4xl p-2 bg-black/90 border-none">
        {selectedImage && (
          <img
            src={getMediaUrl(selectedImage)}
            alt="Full view"
            className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
          />
        )}
      </Dialog>
    </>
  );
};
