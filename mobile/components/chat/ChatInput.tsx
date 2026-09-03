import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Send, Image as ImageIcon, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '../../lib/upload';
import { useAuthStore } from '../../stores/authStore';

interface ChatInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: string) => void;
  isSending?: boolean;
}

export default function ChatInput({ onSend, isSending = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
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

    if (!res.canceled && res.assets[0] && user) {
      try {
        setUploadingMedia(true);
        const publicUrl = await uploadMedia(
          res.assets[0].uri,
          'messages',
          user.id,
          'image'
        );
        onSend(text.trim() || '', publicUrl, 'image');
        setText('');
      } catch (err: any) {
        console.error('Failed to upload chat image', err);
        Alert.alert('Upload Error', 'Could not upload attachment. Please try again.');
      } finally {
        setUploadingMedia(false);
      }
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

    if (!res.canceled && res.assets[0] && user) {
      try {
        setUploadingMedia(true);
        const publicUrl = await uploadMedia(
          res.assets[0].uri,
          'messages',
          user.id,
          'image'
        );
        onSend(text.trim() || '', publicUrl, 'image');
        setText('');
      } catch (err: any) {
        console.error('Failed to upload camera image', err);
        Alert.alert('Upload Error', 'Could not upload photo. Please try again.');
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  return (
    <View className="flex-row items-end p-3 bg-[#141819] border-t border-[#3A4B4D]">
      {/* Pick Photo button */}
      <TouchableOpacity
        className="p-2 mr-1 active:opacity-75"
        onPress={handlePickImage}
        disabled={uploadingMedia || isSending}
      >
        <ImageIcon size={22} color={uploadingMedia ? '#7F8B86' : '#D0A56A'} />
      </TouchableOpacity>

      {/* Camera button */}
      <TouchableOpacity
        className="p-2 mr-1 active:opacity-75"
        onPress={handleTakePhoto}
        disabled={uploadingMedia || isSending}
      >
        <Camera size={20} color="#7F8B86" />
      </TouchableOpacity>

      {/* Message input bar */}
      <View className="flex-1 bg-[#202A2D] border border-[#3A4B4D] rounded-2xl mx-1 min-h-[42px] max-h-32 justify-center">
        <TextInput
          className="px-4 py-2 text-sm text-[#D9D0B8] flex-1"
          placeholder={uploadingMedia ? 'Uploading media...' : 'Message...'}
          placeholderTextColor="#7F8B86"
          multiline
          value={text}
          onChangeText={setText}
          editable={!uploadingMedia}
        />
      </View>

      {/* Send button */}
      <TouchableOpacity
        className={`p-2.5 rounded-full ml-1 active:opacity-85 ${
          text.trim() && !uploadingMedia && !isSending
            ? 'bg-[#D0A56A]'
            : 'bg-[#202A2D] border border-[#3A4B4D]'
        }`}
        onPress={handleSend}
        disabled={!text.trim() || uploadingMedia || isSending}
      >
        <Send
          size={18}
          color={text.trim() && !uploadingMedia && !isSending ? '#171A1C' : '#7F8B86'}
        />
      </TouchableOpacity>
    </View>
  );
}
