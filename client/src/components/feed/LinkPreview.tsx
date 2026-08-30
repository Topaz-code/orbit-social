import React from 'react';
import { LinkPreview as LinkPreviewType } from '../../types/index.js';
import { ExternalLink } from 'lucide-react';

export const LinkPreview: React.FC<{ preview: LinkPreviewType }> = ({ preview }) => {
  if (!preview || (!preview.title && !preview.url)) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group"
    >
      {preview.image && (
        <div className="h-44 w-full overflow-hidden bg-slate-950/20">
          <img
            src={preview.image}
            alt={preview.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <span>{preview.domain || 'External Link'}</span>
          <ExternalLink className="h-3 w-3" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {preview.title}
        </h4>
        {preview.description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
};
