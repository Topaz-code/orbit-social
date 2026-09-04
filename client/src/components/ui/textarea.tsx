import * as React from 'react';
import { cn } from '../../lib/utils.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[90px] w-full rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] px-4 py-3 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496D6B] focus-visible:border-transparent transition-[border-color,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error && 'border-[#B87568] focus-visible:ring-[#B87568]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#B87568] font-medium">{error}</p>}

      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
