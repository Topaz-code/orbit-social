import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image as ImageIcon, Link as LinkIcon, ChevronDown, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePost } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/authStore';
import { uploadMedia } from '../../lib/upload';

export default function PostComposer() {
  const { user } = useAuthStore();
  const [contentText, setContentText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [uploading, setUploading] = useState(false);

  const createPostMutation = useCreatePost();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Orbit needs access to your gallery to attach photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!contentText.trim() && !selectedImage) return;

    try {
      setUploading(true);
      let mediaUrl: string | undefined = undefined;

      if (selectedImage && user) {
        try {
          mediaUrl = await uploadMedia(selectedImage, 'posts', user.id, 'image');
        } catch (e) {
          console.warn('Upload error:', e);
        }
      }

      await createPostMutation.mutateAsync({
        content_text: contentText.trim(),
        media_url: mediaUrl,
        visibility,
      });

      setContentText('');
      setSelectedImage(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <View className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-4 mb-3 mx-4 shadow-sm">
      {/* Input Row */}
      <View className="flex-row items-start space-x-3">
        <Image
          source={{
            uri:
              user.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.display_name || 'Orbit'
              )}&background=2B3940&color=D9D0B8`,
          }}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#3A4B4D' }}
          contentFit="cover"
        />
        <TextInput
          className="flex-1 text-[#D9D0B8] text-sm min-h-[44px] ml-3 pt-2"
          placeholder="What's on your mind?"
          placeholderTextColor="#7F8B86"
          value={contentText}
          onChangeText={setContentText}
          multiline
        />
      </View>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View className="relative mt-3 rounded-xl overflow-hidden border border-[#3A4B4D]">
          <Image
            source={{ uri: selectedImage }}
            style={{ width: '100%', height: 180 }}
            contentFit="cover"
          />
          <TouchableOpacity
            className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full"
            onPress={() => setSelectedImage(null)}
          >
            <X size={16} color="#D9D0B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Actions Row */}
      <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-[#3A4B4D]/50">
        <View className="flex-row items-center space-x-2">
          {/* Photo Picker */}
          <TouchableOpacity
            className="p-2 rounded-lg bg-[#2B3940] border border-[#3A4B4D] active:bg-[#3A4B4D]"
            onPress={handlePickImage}
          >
            <ImageIcon size={17} color="#7F8B86" />
          </TouchableOpacity>

          {/* Link Icon */}
          <TouchableOpacity className="p-2 rounded-lg bg-[#2B3940] border border-[#3A4B4D] active:bg-[#3A4B4D] ml-1.5">
            <LinkIcon size={17} color="#7F8B86" />
          </TouchableOpacity>

          {/* Visibility Pill */}
          <TouchableOpacity
            className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#2B3940] border border-[#3A4B4D] ml-2"
            onPress={() => setVisibility((prev) => (prev === 'public' ? 'friends' : 'public'))}
          >
            <Text className="text-xs text-[#D9D0B8] font-medium mr-1">
              {visibility === 'public' ? 'Public' : 'Friends'}
            </Text>
            <ChevronDown size={14} color="#7F8B86" />
          </TouchableOpacity>
        </View>

        {/* Gold Post Button matching screenshot */}
        <TouchableOpacity
          className={`px-5 py-2 rounded-xl active:opacity-90 ${
            uploading || (!contentText.trim() && !selectedImage)
              ? 'bg-[#D0A56A]/60'
              : 'bg-[#D0A56A]'
          }`}
          onPress={handleCreatePost}
          disabled={uploading || (!contentText.trim() && !selectedImage)}
        >
          <Text className="text-xs font-bold text-[#171A1C]">
            {uploading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
