import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { Users, Plus, Check, Sparkles } from 'lucide-react-native';
import PostCard from '../../components/feed/PostCard';
import PostComposer from '../../components/feed/PostComposer';
import { SkeletonPost, SkeletonUser } from '../../components/ui/Skeleton';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`);
      return res.data?.data;
    },
    enabled: !!groupId,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/posts`);
      return res.data?.data?.posts || res.data?.data || [];
    },
    enabled: !!groupId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      Alert.alert('Success', 'You joined the circle!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not join group');
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#171A1C] p-4">
        <Stack.Screen
          options={{
            title: 'Loading Circle...',
            headerStyle: { backgroundColor: '#141819' },
            headerTintColor: '#D9D0B8',
          }}
        />
        <SkeletonUser />
        <SkeletonPost />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 justify-center items-center bg-[#171A1C] px-6">
        <Text className="text-[#D9D0B8] text-base font-bold">Group not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: group.name,
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {/* Header Banner */}
      <View className="p-5 bg-[#202A2D] border-b border-[#3A4B4D]">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-3.5 flex-1 mr-2">
            <View className="w-14 h-14 rounded-2xl bg-[#2B3940] border border-[#3A4B4D] items-center justify-center mr-3">
              <Users size={28} color="#D0A56A" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-[#D9D0B8]" numberOfLines={1}>{group.name}</Text>
              <Text className="text-xs text-[#A8AAA0]">
                {group.members_count || group.members?.length || 1} / 10 members (Limit)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-[#D0A56A] px-4 py-2 rounded-xl flex-row items-center active:opacity-85"
            onPress={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            <Text className="text-xs font-bold text-[#171A1C]">
              {group.is_member ? 'Joined' : 'Join Circle'}
            </Text>
          </TouchableOpacity>
        </View>

        {group.description ? (
          <Text className="text-xs text-[#D9D0B8] leading-relaxed mt-1">
            {group.description}
          </Text>
        ) : null}
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-[#3A4B4D]/60 px-5 pt-3 mb-3">
        <TouchableOpacity
          className={`mr-6 pb-2 ${activeTab === 'feed' ? 'border-b-2 border-[#D0A56A]' : ''}`}
          onPress={() => setActiveTab('feed')}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'feed' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
            }`}
          >
            Circle Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`pb-2 ${activeTab === 'members' ? 'border-b-2 border-[#D0A56A]' : ''}`}
          onPress={() => setActiveTab('members')}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'members' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
            }`}
          >
            Members ({group.members?.length || group.members_count || 1})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'feed' ? (
        <View>
          <PostComposer />
          {postsLoading ? (
            <View className="px-4 space-y-3">
              <SkeletonPost />
              <SkeletonPost />
            </View>
          ) : postsData?.length > 0 ? (
            postsData.map((post: any) => <PostCard key={post.id} post={post} />)
          ) : (
            <View className="items-center justify-center py-12 px-6">
              <Sparkles size={32} color="#496D6B" className="mb-2" />
              <Text className="text-xs text-[#A8AAA0]">No posts in this circle yet.</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="px-4">
          {(group.members || []).map((m: any) => (
            <View
              key={m.id || m.user_id}
              className="flex-row items-center justify-between bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-3.5 mb-2.5"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <Image
                  source={{
                    uri:
                      m.user?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        m.user?.display_name || m.user?.username || 'User'
                      )}&background=2B3940&color=D9D0B8`,
                  }}
                  style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#3A4B4D' }}
                  contentFit="cover"
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-sm text-[#D9D0B8]">
                    {m.user?.display_name || m.user?.username || 'Member'}
                  </Text>
                  <Text className="text-xs text-[#A8AAA0]">@{m.user?.username || 'user'}</Text>
                </View>
              </View>
              {m.role === 'admin' ? (
                <View className="bg-[#D0A56A]/20 px-2.5 py-1 rounded-lg border border-[#D0A56A]">
                  <Text className="text-[10px] font-bold text-[#D0A56A]">Admin</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
