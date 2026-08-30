import React from 'react';

export const TypingIndicator: React.FC<{ username?: string }> = ({ username }) => {
  return (
    <div className="flex items-center gap-2 py-1 px-3 text-xs text-slate-400 dark:text-slate-500 animate-fade-in">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[11px] italic">
        {username ? `${username} is typing...` : 'typing...'}
      </span>
    </div>
  );
};
