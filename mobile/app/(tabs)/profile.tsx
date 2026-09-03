import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import {
  Camera,
  Edit3,
  LogOut,
  Users,
  Image as ImageIcon,
  Sparkles,
  Check,
  X,
  FileText,
  Calendar,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '../../lib/upload';
import PostCard from '../../components/feed/PostCard';
import { SkeletonPost, SkeletonUser } from '../../components/ui/Skeleton';
import { formatRelativeTime } from '../../lib/utils';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');
  const [coverUri, setCoverUri] = useState(user?.cover_url || '');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user posts
  const { data: postsData = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.get(`/users/${user.id}/posts`);
      return res.data?.data?.posts || res.data?.data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user friends
  const { data: friendsData = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['userFriends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.get(`/users/${user.id}/friends`);
      return res.data?.data || [];
    },
    enabled: !!user?.id,
  });

  const handlePickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  const handlePickCover = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setCoverUri(res.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      let uploadedAvatar = avatarUri;
      let uploadedCover = coverUri;

      if (avatarUri && !avatarUri.startsWith('http')) {
        try {
          uploadedAvatar = await uploadMedia(avatarUri, 'avatars', user.id, 'image');
        } catch (e) {
          console.warn('Avatar upload fallback', e);
        }
      }

      if (coverUri && !coverUri.startsWith('http')) {
        try {
          uploadedCover = await uploadMedia(coverUri, 'covers', user.id, 'image');
        } catch (e) {
          console.warn('Cover upload fallback', e);
        }
      }

      const res = await api.put(`/users/${user.id}`, {
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: uploadedAvatar,
        cover_url: uploadedCover,
      });

      if (res.data?.data) {
        setUser(res.data.data);
      }

      queryClient.invalidateQueries({ queryKey: ['userPosts', user.id] });
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View className="flex-1 bg-[#171A1C]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View className="relative h-44 bg-[#202A2D]">
          {user.cover_url ? (
            <Image
              source={{ uri: user.cover_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full bg-[#202A2D] items-center justify-center">
              <Sparkles size={32} color="#3A4B4D" />
            </View>
          )}
        </View>

        {/* Profile Card Info */}
        <View className="px-4 pb-4">
          <View className="flex-row justify-between items-end -mt-12 mb-3">
            {/* Avatar */}
            <View className="relative">
              <Image
                source={{
                  uri:
                    user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.display_name || 'Orbit'
                    )}&background=2B3940&color=D9D0B8`,
                }}
                style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#171A1C' }}
                contentFit="cover"
              />
              <View className="absolute bottom-1 right-1 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-[#171A1C]" />
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                className="flex-row items-center space-x-1.5 bg-[#2B3940] border border-[#3A4B4D] px-3.5 py-2 rounded-xl active:bg-[#3A4B4D] mr-2"
                onPress={() => {
                  setDisplayName(user.display_name || '');
                  setBio(user.bio || '');
                  setAvatarUri(user.avatar_url || '');
                  setCoverUri(user.cover_url || '');
                  setIsEditModalOpen(true);
                }}
              >
                <Edit3 size={14} color="#D0A56A" />
                <Text className="text-xs font-semibold text-[#D9D0B8] ml-1">Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#202A2D] border border-[#B87568]/50 p-2 rounded-xl active:bg-[#B87568]/20"
                onPress={logout}
              >
                <LogOut size={16} color="#B87568" />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Details */}
          <View className="mt-1">
            <Text className="text-xl font-bold text-[#D9D0B8]">{user.display_name}</Text>
            <Text className="text-xs text-[#A8AAA0]">@{user.username}</Text>
            {user.bio ? (
              <Text className="text-xs text-[#D9D0B8] mt-2 leading-relaxed">{user.bio}</Text>
            ) : (
              <Text className="text-xs text-[#7F8B86] italic mt-1">No bio yet. Orbit quietly.</Text>
            )}
          </View>

          {/* Stats Row without the '100% Private' column */}
          <View className="flex-row items-center gap-4 mt-4 py-3 px-4 bg-[#202A2D] border border-[#3A4B4D] rounded-2xl">
            <View className="flex-1 items-center">
              <Text className="text-base font-bold text-[#D0A56A]">
                {postsData?.length || user.post_count || 0}
              </Text>
              <Text className="text-[10px] uppercase font-semibold text-[#A8AAA0]">Posts</Text>
            </View>
            <View className="w-[1px] h-6 bg-[#3A4B4D]" />
            <View className="flex-1 items-center">
              <Text className="text-base font-bold text-[#D0A56A]">
                {friendsData?.length || user.friend_count || 0}
              </Text>
              <Text className="text-[10px] uppercase font-semibold text-[#A8AAA0]">Friends</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-[#3A4B4D]/60 px-4 mb-4">
          <TouchableOpacity
            className={`mr-6 pb-2.5 ${activeTab === 'posts' ? 'border-b-2 border-[#D0A56A]' : ''}`}
            onPress={() => setActiveTab('posts')}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'posts' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
              }`}
            >
              Posts ({postsData?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-6 pb-2.5 ${activeTab === 'friends' ? 'border-b-2 border-[#D0A56A]' : ''}`}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'friends' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
              }`}
            >
              Connections ({friendsData?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          postsLoading ? (
            <View className="px-4">
              <SkeletonPost />
              <SkeletonPost />
            </View>
          ) : postsData?.length > 0 ? (
            postsData.map((post: any) => <PostCard key={post.id} post={post} />)
          ) : (
            <View className="items-center justify-center py-12 px-6">
              <Sparkles size={32} color="#496D6B" className="mb-2" />
              <Text className="text-sm font-bold text-[#D9D0B8]">No posts yet</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                Your chronological personal timeline is ready.
              </Text>
            </View>
          )
        ) : (
          friendsLoading ? (
            <View className="px-4 space-y-2">
              <SkeletonUser />
              <SkeletonUser />
            </View>
          ) : friendsData?.length > 0 ? (
            <View className="px-4 space-y-2">
              {friendsData.map((friend: any) => (
                <View
                  key={friend.id}
                  className="flex-row items-center justify-between p-3.5 mb-2.5 bg-[#202A2D] border border-[#3A4B4D] rounded-2xl"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{
                        uri:
                          friend.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            friend.display_name || friend.username
                          )}&background=2B3940&color=D9D0B8`,
                      }}
                      style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A4B4D' }}
                      contentFit="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-[#D9D0B8]" numberOfLines={1}>
                        {friend.display_name || friend.username}
                      </Text>
                      <Text className="text-xs text-[#A8AAA0]">@{friend.username}</Text>
                    </View>
                  </View>

                  <View className="px-3 py-1.5 rounded-xl bg-[#496D6B]/30 border border-[#496D6B]">
                    <Text className="text-xs font-semibold text-[#D9D0B8]">Connected</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-12 px-6">
              <Users size={32} color="#496D6B" className="mb-2" />
              <Text className="text-sm font-bold text-[#D9D0B8]">No connections yet</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                Explore Orbit to find and connect with friends.
              </Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#171A1C] border-t border-[#3A4B4D] rounded-t-3xl p-5 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-[#D9D0B8]">Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color="#A8AAA0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Change Photos Buttons */}
              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center bg-[#202A2D] border border-[#3A4B4D] p-3 rounded-xl mr-2"
                  onPress={handlePickAvatar}
                >
                  <Camera size={16} color="#D0A56A" />
                  <Text className="text-xs font-semibold text-[#D9D0B8] ml-2">Change Avatar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center bg-[#202A2D] border border-[#3A4B4D] p-3 rounded-xl"
                  onPress={handlePickCover}
                >
                  <ImageIcon size={16} color="#496D6B" />
                  <Text className="text-xs font-semibold text-[#D9D0B8] ml-2">Change Cover</Text>
                </TouchableOpacity>
              </View>

              {/* Display Name Field */}
              <Text className="text-xs font-semibold text-[#A8AAA0] mb-1">Display Name</Text>
              <TextInput
                className="bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-4 py-2.5 text-sm text-[#D9D0B8] mb-3"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your Name"
                placeholderTextColor="#7F8B86"
              />

              {/* Bio Field */}
              <Text className="text-xs font-semibold text-[#A8AAA0] mb-1">Bio</Text>
              <TextInput
                className="bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-4 py-2.5 text-sm text-[#D9D0B8] min-h-[80px] mb-5"
                value={bio}
                onChangeText={setBio}
                placeholder="Write something about your orbit..."
                placeholderTextColor="#7F8B86"
                multiline
              />

              {/* Save Button */}
              <TouchableOpacity
                className={`py-3 rounded-xl items-center mb-4 ${
                  isSaving ? 'bg-[#D0A56A]/60' : 'bg-[#D0A56A]'
                }`}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                <Text className="text-sm font-bold text-[#171A1C]">
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
