import { Loader2, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { useMediaUpload } from "../../hooks/useMediaUpload.js";
import { Message } from "../../types/index.js";
import { EmojiPicker } from "./EmojiPicker.js";

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
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingCancelledRef = useRef(false);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    const content = text.trim();
    setText("");
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
      const res = await uploadFile(file, "messages");
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "voice"
            : "file";

      await onSendMessage({
        media_url: res.url,
        media_type: type,
        reply_to_id: replyingToMessage?.id || null,
      });

      if (replyingToMessage) onCancelReply();
    } catch (err: any) {
      console.error("Failed to upload message media:", err);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
          (candidate) => MediaRecorder.isTypeSupported(candidate),
        ) || "";
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        const recordedType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const extension = recordedType.includes("mp4") ? "m4a" : "webm";
        if (recordingCancelledRef.current || chunks.length === 0) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const audioBlob = new Blob(chunks, { type: recordedType });
        const audioFile = new File(
          [audioBlob],
          `voice-note-${Date.now()}.${extension}`,
          {
            type: recordedType,
          },
        );

        try {
          const res = await uploadFile(audioFile, "messages");
          await onSendMessage({
            media_url: res.url,
            media_type: "voice",
            reply_to_id: replyingToMessage?.id || null,
          });
          if (replyingToMessage) onCancelReply();
        } catch (err) {
          console.error("Failed to send voice note:", err);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      recordingCancelledRef.current = false;
      setIsRecording(true);
      setRecordingDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access was denied or unavailable.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    recordingCancelledRef.current = cancel;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      if (cancel) {
        mediaRecorderRef.current.stop();
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  return (
    <div className="relative border-t border-[#3A4B4D] bg-[#202A2D] p-3 select-none">
      {/* Reply Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between bg-[#2B3940] border border-[#3A4B4D] px-3 py-1.5 rounded-[10px] mb-2 text-xs animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-[#D0A56A]">
              Replying to {replyingToMessage.sender.display_name}:
            </span>
            <span className="text-[#A8AAA0] truncate">
              {replyingToMessage.content || "Media attachment"}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-[#7F8B86] hover:text-[#D9D0B8]"
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
        <div className="flex items-center justify-between bg-[#B87568]/15 border border-[#B87568]/30 p-2.5 rounded-[10px] animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-[#B87568] animate-ping" />
            <span className="text-xs font-bold text-[#B87568]">
              Recording Voice Note: {recordingDuration}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="px-3 py-1 text-xs text-[#A8AAA0] hover:text-[#B87568] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="flex items-center gap-1 bg-[#B87568] hover:bg-[#C98679] text-[#171A1C] text-xs px-3 py-1.5 rounded-[10px] font-bold transition-colors"
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
            className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-[#2B3940] text-[#7F8B86] hover:text-[#D9D0B8] transition-colors"
            title="Attach file or photo"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#D0A56A]" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-[#2B3940] text-[#7F8B86] hover:text-[#D9D0B8] transition-colors"
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
            className="flex-1 h-10 rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] px-4 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:ring-2 focus:ring-[#496D6B]"
          />

          {/* Voice note or Send button */}
          {text.trim() ? (
            <button
              type="submit"
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] transition-colors shadow-xs active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-[#2B3940] text-[#7F8B86] hover:text-[#71877B] transition-colors"
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
