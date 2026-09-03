import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, CheckCheck, AlertTriangle } from 'lucide-react-native';
import { Message } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { getSafeMediaUrl } from '../../lib/media';

interface MessageBubbleProps {
  message: Message;
}

/**
 * MessageBubble
 * ---------------------------------------------------------------------------
 * CRITICAL: This component is hardened against malformed message payloads.
 *
 * The fatal "send image -> app crashes / reopen chat -> crashes" bug happened
 * because `media_url` can arrive from the API / MQTT in an unexpected shape
 * (a JSON-stringified object, an object like { url } / { publicUrl }, an
 * array, etc.). Passing that straight into <Image source={{ uri }} /> makes
 * expo-image resolve an invalid source and crash the native view.
 *
 * Defences applied here:
 *  1. Strict null/shape guard on `message` up front.
 *  2. `getSafeMediaUrl()` normalises ANY payload into a validated URI string
 *     (or null) — a non-string never reaches `source.uri`.
 *  3. The expo-image ALWAYS gets explicit numeric width/height styles.
 *  4. Every image has an onError fallback that swaps in a safe placeholder
 *     instead of letting a failed/unsupported source tear down the tree.
 *  5. A React error boundary (SafeMessageBubble, the default export) catches
 *     any render-time throw so a single corrupt row shows a fallback bubble
 *     rather than crashing the entire FlatList / chat screen.
 * ---------------------------------------------------------------------------
 */
function MessageBubbleInner({ message }: MessageBubbleProps) {
  // Hooks must run unconditionally (Rules of Hooks) — before any early return.
  const user = useAuthStore((state) => state.user);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [inlineFailed, setInlineFailed] = useState(false);

  // ---- 1. Strict guard: no usable message object -> render nothing ----------
  if (!message || typeof message !== 'object') {
    return null;
  }

  const isMine = Boolean(
    (message.sender_id && message.sender_id === user?.id) ||
      (message.user_id && message.user_id === user?.id) ||
      (message.sender?.id && message.sender?.id === user?.id)
  );

  // ---- 2. Normalise the media URL. NEVER trust the raw value ---------------
  // getSafeMediaUrl returns a validated string URI or null. It is null for:
  // undefined / '' / objects / arrays / JSON strings / "[object Object]".
  const mediaUrl = getSafeMediaUrl(message.media_url);
  const hasInlineMedia = Boolean(mediaUrl) && !inlineFailed;

  // The text content must be a string; coerce defensively.
  const textContent =
    typeof message.content === 'string' ? message.content : '';

  const senderName =
    (typeof message.sender?.display_name === 'string' && message.sender.display_name) ||
    (typeof message.sender?.username === 'string' && message.sender.username) ||
    (typeof message.user?.display_name === 'string' && message.user.display_name) ||
    'Friend';

  // ---- Timestamp guard: invalid dates must not throw ----------------------
  let timeString = '';
  try {
    const d = message.created_at ? new Date(message.created_at) : null;
    timeString =
      d && !isNaN(d.getTime())
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    timeString = '';
  }

  // Replied-to preview is optional and must not assume nested shapes.
  const replyName = message.reply_to?.sender?.display_name || 'Replied';
  const replyText =
    typeof message.reply_to?.content === 'string' && message.reply_to.content
      ? message.reply_to.content
      : 'Media';

  const closePreview = useCallback(() => {
    setImagePreviewOpen(false);
    setPreviewFailed(false);
  }, []);

  // Explicit, NUMERIC pixel dimensions for the full-screen viewer.
  // (Percentage strings on remote expo-image sources are a crash risk on
  // some Android devices, so we compute concrete numbers.)
  const previewWidth = Math.round(windowWidth - 32);
  const previewHeight = Math.round(windowHeight * 0.8);

  return (
    <View className={`mb-3 flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {/* Sender Name for group / incoming messages */}
      {!isMine && (
        <Text className="text-[11px] font-semibold text-[#A8AAA0] mb-1 ml-2">
          {senderName}
        </Text>
      )}

      {/* Main Bubble Container */}
      <View
        className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
          isMine
            ? 'bg-[#496D6B] rounded-br-xs'
            : 'bg-[#2B3940] border border-[#3A4B4D] rounded-bl-xs'
        }`}
      >
        {/* Replied Message Preview */}
        {message.reply_to ? (
          <View
            className={`mb-2 rounded-xl p-2 border-l-2 ${
              isMine ? 'bg-black/20 border-[#D0A56A]' : 'bg-[#202A2D] border-[#496D6B]'
            }`}
          >
            <Text className="text-[10px] font-bold text-[#D0A56A]">{replyName}</Text>
            <Text className="text-[11px] text-[#D9D0B8] opacity-90" numberOfLines={1}>
              {replyText}
            </Text>
          </View>
        ) : null}

        {/* Media Image Attachment — STRICTLY guarded ---------------------- */}
        {hasInlineMedia && mediaUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setPreviewFailed(false);
              setImagePreviewOpen(true);
            }}
            className="mb-2 rounded-xl overflow-hidden border border-[#3A4B4D]/60 bg-[#141819]"
          >
            {/*
              expo-image MUST have explicit width & height. These are fixed
              numeric values so the native view always has measurable layout.
            */}
            <Image
              source={{ uri: mediaUrl }}
              style={{ width: 220, height: 180, backgroundColor: '#141819' }}
              contentFit="cover"
              transition={200}
              onError={(e) => {
                // Never let a broken image crash the row — degrade gracefully.
                console.warn('Chat image failed to load:', e?.error || mediaUrl);
                setInlineFailed(true);
              }}
            />
          </TouchableOpacity>
        ) : null}

        {/* If the media failed to render, show a safe notice instead */}
        {mediaUrl && inlineFailed ? (
          <View className="mb-2 flex-row items-center rounded-xl bg-black/20 px-3 py-2">
            <AlertTriangle size={14} color="#D0A56A" />
            <Text className="text-[11px] text-[#D9D0B8] ml-2">
              Photo unavailable
            </Text>
          </View>
        ) : null}

        {/* Text Message Content */}
        {textContent ? (
          <Text className="text-sm text-[#D9D0B8] leading-relaxed">{textContent}</Text>
        ) : null}

        {/* Footer: Timestamp & Read Status */}
        <View className="flex-row items-center justify-end space-x-1 mt-1">
          {timeString ? (
            <Text className="text-[10px] text-[#D9D0B8]/70 mr-1">{timeString}</Text>
          ) : null}
          {isMine ? <CheckCheck size={12} color="#D0A56A" /> : null}
        </View>
      </View>

      {/* Full-Screen Image Viewer Modal */}
      {mediaUrl && imagePreviewOpen ? (
        <Modal
          visible={imagePreviewOpen}
          transparent
          animationType="fade"
          onRequestClose={closePreview}
        >
          <View className="flex-1 bg-black/95 justify-center items-center p-4">
            <TouchableOpacity
              className="absolute top-12 right-6 p-2.5 bg-[#202A2D] rounded-full z-20 border border-[#3A4B4D]"
              onPress={closePreview}
            >
              <X size={20} color="#D9D0B8" />
            </TouchableOpacity>

            {previewFailed ? (
              <View className="items-center justify-center px-6">
                <AlertTriangle size={40} color="#D0A56A" />
                <Text className="text-sm text-[#D9D0B8] mt-3 text-center">
                  This image could not be displayed.
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: mediaUrl }}
                style={{
                  width: previewWidth, // numeric, computed above
                  height: previewHeight, // numeric, computed above
                  backgroundColor: '#000000',
                }}
                contentFit="contain"
                onError={(e) => {
                  console.warn('Full-screen image failed:', e?.error || mediaUrl);
                  setPreviewFailed(true);
                }}
              />
            )}
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

/**
 * Error boundary for a single message row.
 * If anything throws during render (corrupt payload, native image error that
 * bubbles up, etc.), we render a tiny fallback bubble instead of crashing the
 * whole FlatList — which previously made the entire conversation unopenable.
 */
type EBProps = { children: React.ReactNode; messageId?: string };
type EBState = { hasError: boolean };

class MessageErrorBoundary extends React.Component<EBProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MessageBubble] render error caught:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps: EBProps) {
    // Reset if we're now rendering a different message.
    if (this.state.hasError && prevProps.messageId !== this.props.messageId) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="mb-3 flex-col items-start">
          <View className="px-4 py-2.5 rounded-2xl bg-[#2B3940] border border-[#3A4B4D] rounded-bl-xs max-w-[80%]">
            <View className="flex-row items-center">
              <AlertTriangle size={14} color="#D0A56A" />
              <Text className="text-xs text-[#A8AAA0] ml-2">
                This message can’t be displayed.
              </Text>
            </View>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * SafeMessageBubble — the default export used by chat screens.
 * Wraps the bubble in a per-row error boundary keyed by message id.
 */
export default function MessageBubble({ message }: MessageBubbleProps) {
  if (!message || typeof message !== 'object' || !message.id) {
    // Even the boundary needs a stable element; drop total garbage.
    return null;
  }
  return (
    <MessageErrorBoundary key={message.id} messageId={message.id}>
      <MessageBubbleInner message={message} />
    </MessageErrorBoundary>
  );
}
