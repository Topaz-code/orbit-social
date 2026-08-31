import React from 'react';

const EMOJI_CATEGORIES = {
  Reactions: ['👍', '❤️', '🔥', '🎉', '😂', '😍', '👏', '🚀', '✨', '💯'],
  Smileys: ['😀', '😃', '😄', '😁', '😅', '🤣', '😊', '😇', '🙂', '😉', '😌', '🥰', '😘', '😋', '😜', '🤔', '🤫', '😴', '🤯', '🥳'],
  Gestures: ['👋', '🙌', '👌', '✌️', '🤞', '🤙', '🤝', '🙏', '💪', '👀'],
  Objects: ['📸', '☕', '🎮', '🎨', '🏔️', '🎵', '⚽', '📚', '💡', '🪐', '💬', '📞'],
};

export const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  return (
    <div className="p-3 w-72 rounded-2xl border border-[#3A4B4D] bg-[#202A2D] shadow-2xl animate-fade-in select-none">
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
          <div key={cat}>
            <p className="text-[10px] font-bold text-[#A8AAA0] uppercase tracking-wider mb-1">
              {cat}
            </p>
            <div className="grid grid-cols-6 gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-[#2B3940] text-lg hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

  );
};
