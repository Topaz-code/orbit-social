import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#496D6B]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#D0A56A] text-[#171A1C]',
        secondary: 'border-transparent bg-[#496D6B] text-[#D9D0B8]',
        destructive: 'border-transparent bg-[#B87568] text-[#171A1C]',
        outline: 'text-[#D9D0B8] border-[#3A4B4D]',
        cyan: 'bg-[#496D6B]/20 text-[#D9D0B8] border border-[#496D6B]/40',
        emerald: 'bg-[#71877B]/20 text-[#71877B] border border-[#71877B]/40',
        amber: 'bg-[#D0A56A]/20 text-[#D0A56A] border border-[#D0A56A]/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
