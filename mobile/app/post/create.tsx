import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePost } from '../../hooks/useFeed';
import { uploadMedia } from '../../lib/upload';
import { useAuthStore } from '../../stores/authStore';
import { Image as ImageIcon, Globe, Users, X } from 'lucide-react-native';

export default function CreatePostScreen() {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthStore();
  const createPost = useCreatePost();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !imageUri) return;

    setIsUploading(true);
    try {
      let mediaUrl: string | undefined = undefined;
      if (imageUri && user) {
        try {
          mediaUrl = await uploadMedia(imageUri, 'posts', user.id, 'image');
        } catch (e) {
          console.warn('Upload fallback', e);
        }
      }

      await createPost.mutateAsync({
        content_text: text.trim(),
        media_url: mediaUrl,
        visibility,
      });

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#171A1C] p-4">
      <Stack.Screen
        options={{
          title: 'New Orbit Post',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              className={`bg-[#D0A56A] px-4 py-1.5 rounded-xl ${
                isUploading || (!text.trim() && !imageUri) ? 'opacity-60' : 'active:opacity-85'
              }`}
              onPress={handlePost}
              disabled={isUploading || (!text.trim() && !imageUri)}
            >
              <Text className="text-[#171A1C] font-bold text-xs">
                {isUploading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-4 flex-1">
        <TextInput
          className="text-base text-[#D9D0B8] mb-4 flex-1"
          placeholder="Share with your private orbit..."
          placeholderTextColor="#7F8B86"
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
        />

        {imageUri && (
          <View className="relative mb-4 rounded-xl overflow-hidden border border-[#3A4B4D]">
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: 200 }}
              contentFit="cover"
            />
            <TouchableOpacity
              className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full"
              onPress={() => setImageUri(null)}
            >
              <X size={16} color="#D9D0B8" />
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center justify-between pt-3 border-t border-[#3A4B4D]/60">
          <TouchableOpacity
            className="flex-row items-center bg-[#2B3940] border border-[#3A4B4D] px-3.5 py-2 rounded-xl active:bg-[#3A4B4D]"
            onPress={pickImage}
          >
            <ImageIcon size={18} color="#D0A56A" />
            <Text className="text-xs font-semibold text-[#D9D0B8] ml-2">Attach Media</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center bg-[#2B3940] border border-[#3A4B4D] px-3 py-2 rounded-xl"
            onPress={() => setVisibility((prev) => (prev === 'public' ? 'friends' : 'public'))}
          >
            {visibility === 'public' ? (
              <Globe size={15} color="#D0A56A" />
            ) : (
              <Users size={15} color="#496D6B" />
            )}
            <Text className="text-xs font-semibold text-[#D9D0B8] ml-1.5 capitalize">
              {visibility}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
