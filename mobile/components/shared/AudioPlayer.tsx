import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, TriangleAlert } from 'lucide-react-native';
import { isValidMediaUri } from '../../lib/media';

interface AudioPlayerProps {
  /** Must be a non-empty, validated URI. A null/'' value renders the error UI. */
  uri?: string | null;
  onError?: (reason: string) => void;
}

/**
 * AudioPlayer
 * ---------------------------------------------------------------------------
 * FIX 2 — this file was a placeholder that rendered the literal text
 * "AudioPlayer Component". It is now a real, hardened expo-av player.
 *
 * The fatal part of the voice-note bug was here: a message row persisted after
 * a failed send had `media_type: 'audio'` with `media_url: null`. Passing that
 * null into `Audio.Sound.createAsync({ uri: null })` makes the native player
 * dereference a null pointer and crash the process — there is no JS stack to
 * catch, so an error boundary cannot save you. The guard therefore lives in
 * *this* component too, not just in MessageBubble:
 *
 *   1. `isValidMediaUri(uri)` must pass before ANY expo-av call is made.
 *   2. The sound is created lazily on first play, never during render.
 *   3. `unloadAsync()` always runs on unmount so a scrolling FlatList cannot
 *      leak native player instances (leaks also crash after ~16 instances).
 *   4. Every await is inside try/catch and degrades to the error UI.
 * ---------------------------------------------------------------------------
 */
export default function AudioPlayer({ uri, onError }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [durationLabel, setDurationLabel] = useState('0:00');

  // Single source of truth: a null/empty/garbage URI never reaches expo-av.
  const safeUri = typeof uri === 'string' && isValidMediaUri(uri) ? uri.trim() : null;

  const fail = useCallback(
    (reason: string) => {
      setIsPlaying(false);
      setHasFailed(true);
      try {
        onError?.(reason);
      } catch {
        // A throwing consumer must not take the bubble down.
      }
    },
    [onError]
  );

  // Always release the native player when the row scrolls out / unmounts.
  useEffect(() => {
    return () => {
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        try {
          sound.setOnPlaybackStatusUpdate(null);
          sound.unloadAsync().catch(() => {});
        } catch {
          // Already torn down by the native side — safe to ignore.
        }
      }
    };
  }, []);

  const togglePlayback = async () => {
    if (!safeUri) {
      fail('No playable audio URL');
      return;
    }

    try {
      let sound = soundRef.current;

      if (!sound) {
        // `setAudioModeAsync` can reject on devices with no audio route; a
        // failure here must not block playback of the note itself.
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
          });
        } catch (modeErr: any) {
          console.warn('[AudioPlayer] setAudioModeAsync failed:', modeErr?.message || modeErr);
        }

        const { sound: created } = await Audio.Sound.createAsync(
          { uri: safeUri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 },
          (status) => {
            if (!status?.isLoaded) {
              if (status?.error) fail(String(status.error));
              return;
            }
            setIsPlaying(Boolean(status.isPlaying));
            if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
              const totalSeconds = Math.round(status.durationMillis / 1000);
              setDurationLabel(
                `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
              );
            }
          }
        );

        soundRef.current = created;
        sound = created;
      }

      setIsReady(true);

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err: any) {
      console.error('[AudioPlayer] playback error:', err?.message || err);
      fail(err?.message || 'Voice note could not be played');
    }
  };

  // ---- Hard guard: no valid URI -> static error UI, NO player is mounted ----
  if (!safeUri || hasFailed) {
    return (
      <View className="mb-2 flex-row items-center rounded-xl bg-black/20 px-3 py-2">
        <TriangleAlert size={14} color="#B87568" />
        <Text className="text-[11px] text-[#D9D0B8] ml-2">
          Voice note unavailable
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={togglePlayback}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause voice note' : 'Play voice note'}
      className="mb-2 flex-row items-center rounded-xl bg-black/20 border border-[#3A4B4D]/60 px-3 py-2 min-w-[190px]"
    >
      <View className="w-8 h-8 rounded-full bg-[#D0A56A] items-center justify-center mr-2.5">
        {isPlaying ? (
          <Pause size={14} color="#171A1C" />
        ) : (
          <Play size={14} color="#171A1C" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-semibold text-[#D9D0B8]">Voice note</Text>
        <Text className="text-[10px] text-[#A8AAA0] mt-0.5">
          {isReady ? durationLabel : 'Tap to play'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
