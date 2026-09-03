import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Search, Sparkles, UserPlus, Users, MessageSquare, Check, Compass } from 'lucide-react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import api from '../../lib/api';
import PostCard from '../../components/feed/PostCard';
import { SkeletonPost, SkeletonUser, SkeletonGroup } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../stores/authStore';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'posts' | 'groups'>('people');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // 1. Discover People Query (matches web frontend /users/discover)
  const { data: discoverUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['discover-users'],
    queryFn: async () => {
      const res = await api.get('/users/discover');
      return res.data?.data || [];
    },
  });

  // 2. Explore Posts Query (matches web frontend /posts/explore)
  const { data: explorePosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['explore-posts'],
    queryFn: async () => {
      const res = await api.get('/posts/explore?limit=20');
      return res.data?.data?.posts || res.data?.data || [];
    },
  });

  // 3. Discover Groups Query (matches web frontend /groups/discover)
  const { data: discoverGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['discover-groups'],
    queryFn: async () => {
      const res = await api.get('/groups/discover');
      return res.data?.data || [];
    },
  });

  // 4. Search Query (when query is entered)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', searchQuery, activeTab],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${activeTab}`);
      return res.data?.data || [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Friend Request Mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.post(`/friends/request/${targetUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-users'] });
      Alert.alert('Connection Sent', 'Friend request sent successfully!');
    },
  });

  // Join Group Mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await api.post(`/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-groups'] });
      Alert.alert('Joined Group', 'You are now a member of this circle!');
    },
  });

  // Filtered lists
  const filteredUsers = searchQuery.trim() && searchResults
    ? searchResults
    : discoverUsers.filter((u: any) => {
        if (currentUser?.id && u.id === currentUser.id) return false;
        const q = searchQuery.toLowerCase();
        return (
          u.display_name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          (u.bio && u.bio.toLowerCase().includes(q))
        );
      });

  const filteredPosts = searchQuery.trim() && searchResults ? searchResults : explorePosts;
  const filteredGroups = searchQuery.trim() && searchResults ? searchResults : discoverGroups;

  return (
    <View className="flex-1 bg-[#171A1C]">
      {/* Explore Banner */}
      <View className="mx-4 mt-3 mb-3 p-3.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] flex-row items-center space-x-3">
        <View className="w-10 h-10 rounded-xl bg-[#2B3940] border border-[#3A4B4D] items-center justify-center mr-2">
          <Compass size={20} color="#D0A56A" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-[#D9D0B8]">Explore Orbit</Text>
          <Text className="text-[11px] text-[#A8AAA0]" numberOfLines={1}>
            Discover new people, posts, and micro-circles.
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View className="mx-4 mb-3">
        <View className="flex-row items-center bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-3.5 py-2">
          <Search size={16} color="#D0A56A" className="mr-2" />
          <TextInput
            className="flex-1 text-xs text-[#D9D0B8] ml-2"
            placeholder="Search people, posts, circles..."
            placeholderTextColor="#7F8B86"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View className="flex-row mx-4 mb-3 p-1 bg-[#202A2D] rounded-xl border border-[#3A4B4D]">
        <TouchableOpacity
          className={`flex-1 py-2 items-center rounded-lg ${
            activeTab === 'people' ? 'bg-[#2B3940] border border-[#3A4B4D]' : ''
          }`}
          onPress={() => setActiveTab('people')}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'people' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
            }`}
          >
            People
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center rounded-lg ${
            activeTab === 'posts' ? 'bg-[#2B3940] border border-[#3A4B4D]' : ''
          }`}
          onPress={() => setActiveTab('posts')}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'posts' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
            }`}
          >
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center rounded-lg ${
            activeTab === 'groups' ? 'bg-[#2B3940] border border-[#3A4B4D]' : ''
          }`}
          onPress={() => setActiveTab('groups')}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'groups' ? 'text-[#D0A56A]' : 'text-[#A8AAA0]'
            }`}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content Rendering with Skeletons */}
      {activeTab === 'people' && (
        usersLoading || searchLoading ? (
          <View className="px-4 space-y-2">
            <SkeletonUser />
            <SkeletonUser />
            <SkeletonUser />
            <SkeletonUser />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <Users size={32} color="#496D6B" className="mb-2" />
            <Text className="text-sm font-bold text-[#D9D0B8]">No people found</Text>
            <Text className="text-xs text-[#A8AAA0] text-center mt-1">
              You are connected with all visible members.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isFriend = item.friendship_status === 'friends';
              const isPending = item.friendship_status === 'pending_sent';

              return (
                <View className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
                  <TouchableOpacity
                    className="flex-row items-center flex-1 mr-2 active:opacity-80"
                    onPress={() => router.push(`/profile/${item.id}`)}
                  >
                    <Image
                      source={{
                        uri:
                          item.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.display_name || item.username
                          )}&background=2B3940&color=D9D0B8`,
                      }}
                      style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A4B4D' }}
                      contentFit="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-[#D9D0B8]" numberOfLines={1}>
                        {item.display_name}
                      </Text>
                      <Text className="text-xs text-[#A8AAA0]">@{item.username}</Text>
                      {item.bio ? (
                        <Text className="text-[11px] text-[#7F8B86] mt-0.5" numberOfLines={1}>
                          {item.bio}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {isFriend ? (
                    <View className="flex-row items-center px-3 py-1.5 rounded-xl bg-[#496D6B]/30 border border-[#496D6B]">
                      <Check size={13} color="#D9D0B8" />
                      <Text className="text-xs font-semibold text-[#D9D0B8] ml-1">Friends</Text>
                    </View>
                  ) : isPending ? (
                    <View className="px-3 py-1.5 rounded-xl bg-[#2B3940] border border-[#3A4B4D]">
                      <Text className="text-xs font-medium text-[#A8AAA0]">Pending</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex-row items-center px-3.5 py-2 rounded-xl bg-[#D0A56A] active:opacity-85"
                      onPress={() => sendRequestMutation.mutate(item.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      <UserPlus size={14} color="#171A1C" />
                      <Text className="text-xs font-bold text-[#171A1C] ml-1">Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )
      )}

      {activeTab === 'posts' && (
        postsLoading || searchLoading ? (
          <View className="px-4 space-y-3">
            <SkeletonPost />
            <SkeletonPost />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <Sparkles size={32} color="#496D6B" className="mb-2" />
            <Text className="text-sm font-bold text-[#D9D0B8]">No public posts yet</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => <PostCard post={item} />}
          />
        )
      )}

      {activeTab === 'groups' && (
        groupsLoading || searchLoading ? (
          <View className="px-4 space-y-2">
            <SkeletonGroup />
            <SkeletonGroup />
          </View>
        ) : filteredGroups.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <Users size={32} color="#496D6B" className="mb-2" />
            <Text className="text-sm font-bold text-[#D9D0B8]">No groups to discover</Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View className="p-4 mb-3 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{
                        uri:
                          item.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.name
                          )}&background=2B3940&color=D9D0B8`,
                      }}
                      style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#3A4B4D' }}
                      contentFit="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-[#D9D0B8]" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-[11px] text-[#A8AAA0]">
                        {item.member_count || item.members?.length || 1}/10 members
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="px-3.5 py-1.5 rounded-xl bg-[#D0A56A] active:opacity-85"
                    onPress={() => joinGroupMutation.mutate(item.id)}
                    disabled={joinGroupMutation.isPending}
                  >
                    <Text className="text-xs font-bold text-[#171A1C]">Join</Text>
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text className="text-xs text-[#A8AAA0] mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )
      )}
    </View>
  );
}
