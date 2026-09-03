import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Loader2 } from 'lucide-react-native';
import { requestMicrophonePermission } from '../../lib/permissions';

interface VoiceNoteRecorderProps {
  /** Called with a local file URI plus the mime type the upload must declare. */
  onRecorded: (uri: string, mimeType: string) => void;
  /**
   * Lets the parent rearrange its bar (hide the text input / send button)
   * while recording. Without this the parent had no way to know a recording
   * ended via Discard, which left its input bar stuck in recording mode.
   */
  onRecordingChange?: (recording: boolean) => void;
  /** Render nothing while idle (e.g. when the user has draft text). */
  hideWhenIdle?: boolean;
  disabled?: boolean;
  maxDurationMs?: number;
}

/**
 * VoiceNoteRecorder
 * ---------------------------------------------------------------------------
 * FIX 2 (root cause #3 — the recording itself).
 *
 * This file was a placeholder that rendered "VoiceNoteRecorder Component", so
 * mobile had no recording path at all. It is now implemented with an explicit,
 * widely-supported container: **AAC audio inside an MPEG-4 wrapper (`.m4a`)**.
 *
 * Why the options below are explicit instead of `RecordingOptionsPresets`:
 *   • The high-quality preset on Android emits `.m4a` but reports a mime that
 *     varies by device (`audio/mp4`, `audio/x-m4a`, sometimes `audio/aac`).
 *   • `lib/upload.ts::guessExt` used to see the substring "mp4" in
 *     `audio/mp4` and rename the file to `.mp4`, which the server rejected:
 *     "Unsupported file type or extension: audio/mp4 (.mp4)".
 *   • Pinning `extension` on both platforms means the URI, the extension and
 *     the declared mime can no longer disagree.
 *
 * `.m4a` / AAC plays natively on iOS, Android and in every browser — it is the
 * safest single choice for a cross-platform voice note.
 * ---------------------------------------------------------------------------
 */
export const VOICE_NOTE_MIME_TYPE = 'audio/mp4';

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export default function VoiceNoteRecorder({
  onRecorded,
  onRecordingChange,
  hideWhenIdle = false,
  disabled = false,
  maxDurationMs = 120000,
}: VoiceNoteRecorderProps) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Never leave a live microphone or a timer behind if the row unmounts
  // mid-recording (the chat screen unmounts on navigation).
  useEffect(() => {
    return () => {
      clearTimer();
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) {
        try {
          rec.stopAndUnloadAsync().catch(() => {});
        } catch {
          // Already unloaded.
        }
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isPreparing) return;

    try {
      setIsPreparing(true);

      const granted = await requestMicrophonePermission();
      if (!granted) return;

      // Recording needs the audio session reconfigured; this throws on some
      // Android builds when a call is active, so it must not be fatal.
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch (modeErr: any) {
        console.warn('[VoiceNote] setAudioModeAsync failed:', modeErr?.message || modeErr);
      }

      // `createAsync` returns the instance; there is no global "getRecording"
      // accessor in expo-av 15, so hold the reference ourselves.
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      if (!recording) {
        throw new Error('Recorder did not start');
      }
      recordingRef.current = recording;

      setIsRecording(true);
      setElapsed(0);
      // Tell the parent so it can hand the whole bar to the recorder.
      onRecordingChange?.(true);
      clearTimer();
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceNote] start failed:', err?.message || err);
      setIsRecording(false);
      onRecordingChange?.(false);
      clearTimer();
      recordingRef.current = null;
    } finally {
      setIsPreparing(false);
    }
  }, [isRecording, isPreparing, onRecordingChange]);

  const stopRecording = useCallback(
    async (discard = false) => {
      clearTimer();
      const recording = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);
      setElapsed(0);
      // ALWAYS notify the parent — including the Discard path — so the input
      // bar can never be left stranded in recording mode.
      onRecordingChange?.(false);

      // Restore the normal playback audio session before handing off.
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch {
        // Non-fatal.
      }

      if (!recording) return;

      try {
        const status = await recording.stopAndUnloadAsync();

        // A recording shorter than ~1s is almost always a mis-tap.
        if (discard || (status?.durationMillis ?? 0) < 1000) {
          return;
        }

        const uri = status?.uri;
        // The single most important check: never hand a null/empty URI back to
        // the caller, because that is what used to be persisted as a message
        // with `media_url: null` and crash the chat on the next open.
        if (!uri || typeof uri !== 'string' || !uri.trim()) {
          throw new Error('Recording finished but produced no file');
        }

        onRecorded(uri.trim(), VOICE_NOTE_MIME_TYPE);
      } catch (err: any) {
        console.error('[VoiceNote] stop failed:', err?.message || err);
      }
    },
    [onRecorded, onRecordingChange]
  );

  // Auto-stop at the cap so a forgotten recording cannot fill the disk.
  useEffect(() => {
    if (isRecording && elapsed * 1000 >= maxDurationMs) {
      stopRecording(false);
    }
  }, [isRecording, elapsed, maxDurationMs, stopRecording]);

  if (!isRecording) {
    // Parent asked us to yield the slot (e.g. the user is typing a draft).
    if (hideWhenIdle) return null;
    return (
      <TouchableOpacity
        className="p-2 mr-1 active:opacity-75"
        onPress={startRecording}
        disabled={disabled || isPreparing}
        accessibilityRole="button"
        accessibilityLabel="Record voice note"
      >
        {isPreparing ? (
          <Loader2 size={20} color="#7F8B86" />
        ) : (
          <Mic size={20} color={disabled ? '#7F8B86' : '#D0A56A'} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-row items-center bg-[#202A2D] border border-[#B87568]/50 rounded-2xl px-3 py-2 mx-1 flex-1">
      <View className="w-2.5 h-2.5 rounded-full bg-[#B87568] mr-2" />
      <Text className="text-xs font-semibold text-[#D9D0B8] flex-1">
        {`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`}
      </Text>
      <TouchableOpacity
        className="p-1.5 mr-1 active:opacity-75"
        onPress={() => stopRecording(true)}
        accessibilityRole="button"
        accessibilityLabel="Discard voice note"
      >
        <Text className="text-[11px] text-[#7F8B86]">Discard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="p-2 bg-[#D0A56A] rounded-full active:opacity-85"
        onPress={() => stopRecording(false)}
        accessibilityRole="button"
        accessibilityLabel="Send voice note"
      >
        <Square size={14} color="#171A1C" />
      </TouchableOpacity>
    </View>
  );
}
