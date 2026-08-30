import React, { useState, useRef } from 'react';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { Message } from '../../types/index.js';
import { EmojiPicker } from './EmojiPicker.js';
import { Send, Smile, Paperclip, Mic, MicOff, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (data: {
    content?: string;
    media_url?: string;
    media_type?: string;
    reply_to_id?: string | null;
  }) => Promise<any>;
  onTyping: (isTyping: boolean) => void;
  replyingToMessage: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  replyingToMessage,
  onCancelReply,
  disabled,
}) => {
  const { uploadFile, isUploading } = useMediaUpload();
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    const content = text.trim();
    setText('');
    onTyping(false);

    await onSendMessage({
      content,
      reply_to_id: replyingToMessage?.id || null,
    });

    if (replyingToMessage) onCancelReply();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadFile(file, 'messages');
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'voice'
        : 'file';

      await onSendMessage({
        media_url: res.url,
        media_type: type,
        reply_to_id: replyingToMessage?.id || null,
      });

      if (replyingToMessage) onCancelReply();
    } catch (err: any) {
      console.error('Failed to upload message media:', err);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm',
        });

        try {
          const res = await uploadFile(audioFile, 'messages');
          await onSendMessage({
            media_url: res.url,
            media_type: 'voice',
            reply_to_id: replyingToMessage?.id || null,
          });
          if (replyingToMessage) onCancelReply();
        } catch (err) {
          console.error('Failed to send voice note:', err);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access was denied or unavailable.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        mediaRecorderRef.current.stop();
        audioChunksRef.current = [];
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  return (
    <div className="relative border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3 select-none">
      {/* Reply Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl mb-2 text-xs animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Replying to {replyingToMessage.sender.display_name}:
            </span>
            <span className="text-slate-500 truncate">
              {replyingToMessage.content || 'Media attachment'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-50">
          <EmojiPicker
            onSelect={(emoji) => setText((prev) => prev + emoji)}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Recording Voice Note: {recordingDuration}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="px-3 py-1 text-xs text-slate-500 hover:text-rose-500 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-colors"
            >
              <Send className="h-3.5 w-3.5" /> Send Voice
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File attachment */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Attach file or photo"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Emojis"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Input field */}
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            disabled={disabled}
            className="flex-1 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Voice note or Send button */}
          {text.trim() ? (
            <button
              type="submit"
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Record voice note"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
