import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { UserPlus, MessageSquare, Check, Sparkles, Phone } from 'lucide-react-native';
import PostCard from '../../components/feed/PostCard';
import { SkeletonPost, SkeletonUser } from '../../components/ui/Skeleton';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}`);
      return res.data?.data;
    },
    enabled: !!userId,
  });

  const { data: postsData = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/posts`);
      return res.data?.data?.posts || res.data?.data || [];
    },
    enabled: !!userId,
  });

  const [requestSent, setRequestSent] = useState(false);

  const handleSendFriendRequest = async () => {
    try {
      await api.post(`/friends/request/${userId}`);
      setRequestSent(true);
      Alert.alert('Success', 'Friend request sent!');
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    } catch (e: any) {
      Alert.alert('Notice', e.response?.data?.message || 'Request already pending');
    }
  };

  const handleStartChat = async () => {
    try {
      const res = await api.post('/conversations', {
        type: 'direct',
        recipient_id: userId,
      });
      const convId = res.data?.data?.id || res.data?.id;
      if (convId) {
        router.push(`/chat/${convId}`);
      }
    } catch {
      router.push('/(tabs)/messages');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#171A1C] p-4">
        <Stack.Screen
          options={{
            title: 'Loading Profile...',
            headerStyle: { backgroundColor: '#141819' },
            headerTintColor: '#D9D0B8',
          }}
        />
        <SkeletonUser />
        <SkeletonPost />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-[#171A1C] px-6">
        <Text className="text-[#D9D0B8] text-base font-bold">User not found</Text>
      </View>
    );
  }

  const isFriend = user.friendship_status === 'friends';

  return (
    <ScrollView className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: user.display_name,
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {/* Cover */}
      <View className="relative w-full h-44 bg-[#202A2D]">
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

      {/* Profile Bar */}
      <View className="px-4 pb-4">
        <View className="flex-row justify-between items-end -mt-12 mb-3">
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
            {user.is_online && (
              <View className="absolute bottom-1 right-1 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-[#171A1C]" />
            )}
          </View>

          <View className="flex-row items-center space-x-2">
            {isFriend ? (
              <View className="flex-row items-center px-3 py-2 rounded-xl bg-[#496D6B]/30 border border-[#496D6B] mr-2">
                <Check size={14} color="#D9D0B8" />
                <Text className="text-xs font-semibold text-[#D9D0B8] ml-1">Friends</Text>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center px-3.5 py-2 rounded-xl bg-[#D0A56A] active:opacity-85 mr-2"
                onPress={handleSendFriendRequest}
                disabled={requestSent}
              >
                <UserPlus size={14} color="#171A1C" />
                <Text className="text-xs font-bold text-[#171A1C] ml-1">
                  {requestSent ? 'Pending' : 'Connect'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center px-3.5 py-2 rounded-xl bg-[#496D6B] active:opacity-85"
              onPress={handleStartChat}
            >
              <MessageSquare size={14} color="#D9D0B8" />
              <Text className="text-xs font-bold text-[#D9D0B8] ml-1">Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Details */}
        <Text className="text-xl font-bold text-[#D9D0B8]">{user.display_name}</Text>
        <Text className="text-xs text-[#A8AAA0]">@{user.username}</Text>
        {user.bio ? (
          <Text className="text-xs text-[#D9D0B8] mt-2 leading-relaxed">{user.bio}</Text>
        ) : null}

        {/* Stats Row */}
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
              {user.friend_count || 0}
            </Text>
            <Text className="text-[10px] uppercase font-semibold text-[#A8AAA0]">Friends</Text>
          </View>
        </View>
      </View>

      {/* User's Posts Feed */}
      <View className="px-4 pt-2">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#A8AAA0] mb-3">
          Posts by {user.display_name}
        </Text>
        {postsLoading ? (
          <View className="space-y-3">
            <SkeletonPost />
            <SkeletonPost />
          </View>
        ) : postsData?.length > 0 ? (
          postsData.map((post: any) => <PostCard key={post.id} post={post} />)
        ) : (
          <View className="items-center justify-center py-12 px-6">
            <Sparkles size={32} color="#496D6B" className="mb-2" />
            <Text className="text-sm font-bold text-[#D9D0B8]">No posts shared yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
