import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { uploadMedia } from '../../lib/upload';

export default function EditProfileScreen() {
  const { user, checkAuth } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatar_url = user?.avatar_url;
      if (avatarUri) {
        avatar_url = await uploadMedia(avatarUri, 'avatars', user!.id, 'image');
      }

      await api.put(`/users/${user?.id}`, {
        display_name: displayName,
        bio,
        avatar_url
      });
      await checkAuth();
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="items-center mb-8">
        <TouchableOpacity onPress={pickImage}>
          <View className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden mb-2">
            {(avatarUri || user?.avatar_url) ? (
              <Image source={{ uri: avatarUri || user?.avatar_url }} className="w-full h-full" />
            ) : (
              <View className="flex-1 items-center justify-center bg-indigo-100">
                <Text className="text-3xl text-indigo-600 font-bold">{user?.display_name?.charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text className="text-indigo-600 font-medium text-center">Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className="text-slate-600 font-medium mb-2">Display Name</Text>
        <TextInput 
          className="border border-slate-300 rounded-lg p-3 text-slate-800"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <View className="mb-8">
        <Text className="text-slate-600 font-medium mb-2">Bio</Text>
        <TextInput 
          className="border border-slate-300 rounded-lg p-3 text-slate-800 h-24 text-top"
          multiline
          value={bio}
          onChangeText={setBio}
        />
      </View>

      <TouchableOpacity 
        className={`bg-indigo-600 p-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
        onPress={handleSave}
        disabled={loading}
      >
        <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
