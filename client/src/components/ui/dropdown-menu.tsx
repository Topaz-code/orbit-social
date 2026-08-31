import * as React from 'react';
import { cn } from '../../lib/utils.js';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right',
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={cn(
            'absolute z-[99] mt-2 min-w-[10rem] rounded-xl border border-[#3A4B4D] bg-[#202A2D] p-1.5 shadow-2xl animate-fade-in focus:outline-none ring-1 ring-black/20',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}> = ({ children, onClick, className, destructive }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#D9D0B8] hover:bg-[#2B3940] transition-colors text-left font-medium',
        destructive && 'text-[#B87568] hover:bg-[#B87568]/15 hover:text-[#C98679]',
        className
      )}
    >
      {children}
    </button>
  );
};

export const DropdownDivider = () => (
  <div className="my-1 h-px bg-[#3A4B4D]" />
);

