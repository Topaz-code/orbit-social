import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Send, Image as ImageIcon, Camera, Mic } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  uploadChatMedia,
  uploadVoiceNote,
  formatUploadError,
} from '../../lib/upload';
import { useAuthStore } from '../../stores/authStore';
import VoiceNoteRecorder from './VoiceNoteRecorder';

interface ChatInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: string) => void;
  isSending?: boolean;
}

export default function ChatInput({ onSend, isSending = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const user = useAuthStore((state) => state.user);

  const busy = uploadingMedia || uploadingVoice || isSending;

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const uploadAndSend = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to send attachments.');
      return;
    }

    try {
      setUploadingMedia(true);
      const publicUrl = await uploadChatMedia(asset.uri, user.id, 'image', {
        mimeType: asset.mimeType,
        fileName: asset.fileName || undefined,
      });

      // FIX 2 — never emit a message whose media_url is empty. A row like that
      // is persisted by the chat store and then crashes MessageBubble the next
      // time the conversation is opened.
      if (!publicUrl || typeof publicUrl !== 'string') {
        throw new Error('Upload finished but the server returned no URL');
      }

      onSend(text.trim() || '', publicUrl, 'image');
      setText('');
    } catch (err: any) {
      const detail = formatUploadError(err);
      console.error('[Orbit] Chat attachment upload failed:', detail, err);
      Alert.alert('Upload Error', detail);
    } finally {
      setUploadingMedia(false);
    }
  };

  /**
   * FIX 2 — voice note send path.
   *
   * Three hard rules that prevent the fatal "reopen the chat -> crash" loop:
   *   1. Validate the local URI BEFORE uploading (a recorder that returns
   *      `null` after an interrupted session must not start an upload).
   *   2. Validate the returned public URL BEFORE calling `onSend`.
   *   3. On ANY failure, surface the error and send NOTHING. Persisting a
   *      half-built message with `media_url: null` is exactly what made the
   *      conversation permanently unopenable.
   */
  const handleVoiceNoteRecorded = async (uri: string, mimeType: string) => {
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to send voice notes.');
      return;
    }
    if (!uri || typeof uri !== 'string') {
      Alert.alert('Voice note failed', 'The recording did not produce an audio file.');
      return;
    }

    try {
      setUploadingVoice(true);
      const publicUrl = await uploadVoiceNote(uri, user.id, mimeType);

      if (!publicUrl || typeof publicUrl !== 'string') {
        throw new Error('Upload finished but the server returned no URL');
      }

      // media_type 'voice' matches what the REST API / web client store, and
      // MessageBubble treats 'voice' and 'audio' identically.
      onSend('', publicUrl, 'voice');
    } catch (err: any) {
      const detail = formatUploadError(err);
      console.error('[Orbit] Voice note failed:', detail, err);
      Alert.alert('Voice note failed', detail);
    } finally {
      setUploadingVoice(false);
      setIsRecording(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Orbit needs access to your gallery to send photos.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]) {
      await uploadAndSend(res.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Orbit needs camera access to take and send photos.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]) {
      await uploadAndSend(res.assets[0]);
    }
  };

  return (
    <View className="flex-row items-end p-3 bg-[#141819] border-t border-[#3A4B4D]">
      {isRecording ? (
        // While recording the recorder owns the whole bar: it needs the width
        // for the timer, and the send button must not be reachable.
        <VoiceNoteRecorder
          onRecorded={handleVoiceNoteRecorded}
          disabled={busy}
        />
      ) : (
        <>
          <TouchableOpacity
            className="p-2 mr-1 active:opacity-75"
            onPress={handlePickImage}
            disabled={busy}
          >
            <ImageIcon size={22} color={uploadingMedia ? '#7F8B86' : '#D0A56A'} />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-2 mr-1 active:opacity-75"
            onPress={handleTakePhoto}
            disabled={busy}
          >
            <Camera size={20} color="#7F8B86" />
          </TouchableOpacity>

          {/* Only offer the mic when there is no draft text — the send button
              owns the bar otherwise. */}
          {!text.trim() ? (
            <TouchableOpacity
              className="p-2 mr-1 active:opacity-75"
              onPress={() => setIsRecording(true)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Record voice note"
            >
              <Mic size={20} color={busy ? '#7F8B86' : '#D0A56A'} />
            </TouchableOpacity>
          ) : null}

          <View className="flex-1 bg-[#202A2D] border border-[#3A4B4D] rounded-2xl mx-1 min-h-[42px] max-h-32 justify-center">
            <TextInput
              className="px-4 py-2 text-sm text-[#D9D0B8] flex-1"
              placeholder={
                uploadingVoice
                  ? 'Sending voice note...'
                  : uploadingMedia
                  ? 'Uploading media...'
                  : 'Message...'
              }
              placeholderTextColor="#7F8B86"
              multiline
              value={text}
              onChangeText={setText}
              editable={!busy}
            />
          </View>

          <TouchableOpacity
            className={`p-2.5 rounded-full ml-1 active:opacity-85 ${
              text.trim() && !busy ? 'bg-[#D0A56A]' : 'bg-[#202A2D] border border-[#3A4B4D]'
            }`}
            onPress={handleSend}
            disabled={!text.trim() || busy}
          >
            <Send
              size={18}
              color={text.trim() && !busy ? '#171A1C' : '#7F8B86'}
            />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
