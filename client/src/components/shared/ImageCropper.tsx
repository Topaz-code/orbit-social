import React, { useState, useRef } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  aspectRatio?: 'square' | 'cover';
  onCropComplete: (croppedBlob: Blob) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio = 'square',
  onCropComplete,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generateCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputWidth = aspectRatio === 'square' ? 500 : 1200;
    const outputHeight = aspectRatio === 'square' ? 500 : 400;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const drawWidth = outputWidth;
    const drawHeight = (img.naturalHeight / img.naturalWidth) * outputWidth;

    ctx.drawImage(
      img,
      -drawWidth / 2 + position.x,
      -drawHeight / 2 + position.y,
      drawWidth,
      drawHeight
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onOpenChange(false);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Crop & Adjust Image</DialogTitle>
      </DialogHeader>

      <div
        className="relative overflow-hidden bg-slate-950 rounded-2xl flex items-center justify-center cursor-move select-none"
        style={{ height: aspectRatio === 'square' ? '320px' : '220px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
          draggable={false}
        />

        {/* Overlay Crop Box Guide */}
        <div
          className={`pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
            aspectRatio === 'square' ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{
            margin: 'auto',
            width: aspectRatio === 'square' ? '240px' : '90%',
            height: aspectRatio === 'square' ? '240px' : '180px',
          }}
        />
      </div>

      {/* Control Sliders & Buttons */}
      <div className="flex items-center justify-between gap-4 mt-5 bg-[#2B3940] border border-[#3A4B4D] p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-24 accent-[#D0A56A]"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          <RotateCw className="h-4 w-4 mr-1.5" /> Rotate
        </Button>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={generateCrop}>Apply & Save</Button>
      </DialogFooter>
    </Dialog>
  );
};
