import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Camera, Image as ImageIcon, X, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useStories } from '../../hooks/useStories';
import { uploadMedia } from '../../lib/upload';

export default function CreateStoryScreen() {
  const { user } = useAuthStore();
  const { createStory } = useStories();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take a story photo');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleShareStory = async () => {
    if (!imageUri || !user) return;
    try {
      setUploading(true);
      const publicUrl = await uploadMedia(imageUri, 'stories', user.id, 'image');
      await createStory({
        media_url: publicUrl,
        media_type: 'image',
        caption: caption.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to publish story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'Create Orbit Story',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {imageUri ? (
        <View className="flex-1 relative">
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />

          {/* Top Cancel */}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-full"
            onPress={() => setImageUri(null)}
          >
            <X size={20} color="#D9D0B8" />
          </TouchableOpacity>

          {/* Bottom Caption & Post */}
          <View className="absolute bottom-6 left-4 right-4 bg-[#202A2D]/90 border border-[#3A4B4D] rounded-2xl p-4">
            <TextInput
              className="text-[#D9D0B8] text-sm mb-3"
              placeholder="Add a story caption..."
              placeholderTextColor="#7F8B86"
              value={caption}
              onChangeText={setCaption}
            />
            <TouchableOpacity
              className={`bg-[#D0A56A] py-3 rounded-xl items-center flex-row justify-center space-x-2 ${
                uploading ? 'opacity-70' : 'active:opacity-85'
              }`}
              onPress={handleShareStory}
              disabled={uploading}
            >
              <Send size={16} color="#171A1C" />
              <Text className="text-[#171A1C] font-bold text-sm ml-1.5">
                {uploading ? 'Publishing Story...' : 'Share to Orbit Story'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-6">
            <Camera size={36} color="#D0A56A" />
          </View>
          <Text className="text-xl font-bold text-[#D9D0B8] mb-2 text-center">
            Capture a Story
          </Text>
          <Text className="text-xs text-[#A8AAA0] text-center mb-8 max-w-xs leading-relaxed">
            Stories disappear automatically after 24 hours. No algorithm, only your network.
          </Text>

          <View className="w-full">
            <TouchableOpacity
              className="bg-[#D0A56A] rounded-2xl py-4 flex-row items-center justify-center space-x-2 mb-3 active:opacity-85"
              onPress={handleTakePhoto}
            >
              <Camera size={18} color="#171A1C" />
              <Text className="text-[#171A1C] font-bold text-sm ml-2">Open Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl py-4 flex-row items-center justify-center space-x-2 active:bg-[#2B3940]"
              onPress={handlePickImage}
            >
              <ImageIcon size={18} color="#D0A56A" />
              <Text className="text-[#D9D0B8] font-bold text-sm ml-2">Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
