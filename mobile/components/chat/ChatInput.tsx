import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Send, Image as ImageIcon, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadChatMedia, formatUploadError } from '../../lib/upload';
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
      <TouchableOpacity
        className="p-2 mr-1 active:opacity-75"
        onPress={handlePickImage}
        disabled={uploadingMedia || isSending}
      >
        <ImageIcon size={22} color={uploadingMedia ? '#7F8B86' : '#D0A56A'} />
      </TouchableOpacity>

      <TouchableOpacity
        className="p-2 mr-1 active:opacity-75"
        onPress={handleTakePhoto}
        disabled={uploadingMedia || isSending}
      >
        <Camera size={20} color="#7F8B86" />
      </TouchableOpacity>

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
