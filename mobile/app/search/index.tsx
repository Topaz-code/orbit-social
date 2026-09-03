import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { User, Post, Group } from '../../types';
import PostCard from '../../components/feed/PostCard';
import { Search, ArrowLeft, Users, Sparkles, UserPlus } from 'lucide-react-native';
import { SkeletonPost, SkeletonUser, SkeletonGroup } from '../../components/ui/Skeleton';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'posts' | 'groups'>('people');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, activeTab],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeTab}`);
      return res.data?.data || [];
    },
    enabled: debouncedQuery.length > 0,
  });

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Search Header */}
      <View className="bg-[#141819] pt-12 pb-3.5 px-4 border-b border-[#3A4B4D] flex-row items-center">
        <TouchableOpacity
          className="p-1.5 rounded-lg active:bg-[#2B3940] mr-2"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#D9D0B8" />
        </TouchableOpacity>

        <View className="flex-1 bg-[#2B3940] border border-[#3A4B4D] rounded-xl flex-row items-center px-3.5 h-10">
          <Search size={16} color="#D0A56A" />
          <TextInput
            className="flex-1 ml-2 text-xs text-[#D9D0B8]"
            placeholder="Search people, posts, or circles..."
            placeholderTextColor="#7F8B86"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row bg-[#141819] border-b border-[#3A4B4D]/60 px-4">
        {(['people', 'posts', 'groups'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 items-center ${
              activeTab === tab ? 'border-b-2 border-[#D0A56A]' : ''
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className={`capitalize text-xs font-bold ${
                activeTab === tab ? 'text-[#D0A56A]' : 'text-[#7F8B86]'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results / Skeletons */}
      {isLoading ? (
        <View className="p-4 space-y-2">
          {activeTab === 'people' ? (
            <>
              <SkeletonUser />
              <SkeletonUser />
              <SkeletonUser />
            </>
          ) : activeTab === 'posts' ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : (
            <>
              <SkeletonGroup />
              <SkeletonGroup />
            </>
          )}
        </View>
      ) : !debouncedQuery ? (
        <View className="flex-1 justify-center items-center px-6 py-20">
          <Search size={36} color="#496D6B" className="mb-3" />
          <Text className="text-base font-bold text-[#D9D0B8]">Search in Orbit</Text>
          <Text className="text-xs text-[#A8AAA0] text-center mt-1 max-w-xs">
            Type anything to search for people in your network, public posts, or circles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Sparkles size={32} color="#496D6B" className="mb-2" />
              <Text className="text-sm font-bold text-[#D9D0B8]">
                No results found for "{debouncedQuery}"
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (activeTab === 'people') {
              const user = item as User;
              return (
                <TouchableOpacity
                  className="bg-[#202A2D] p-3.5 mx-4 mb-2.5 rounded-2xl border border-[#3A4B4D] flex-row items-center justify-between active:bg-[#2B3940]"
                  onPress={() => router.push(`/profile/${user.id}`)}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{
                        uri:
                          user.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.display_name || user.username
                          )}&background=2B3940&color=D9D0B8`,
                      }}
                      style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A4B4D' }}
                      contentFit="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-sm text-[#D9D0B8]">{user.display_name}</Text>
                      <Text className="text-xs text-[#A8AAA0]">@{user.username}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="flex-row items-center px-3 py-1.5 bg-[#D0A56A] rounded-xl active:opacity-85"
                    onPress={() => router.push(`/profile/${user.id}`)}
                  >
                    <UserPlus size={13} color="#171A1C" />
                    <Text className="text-xs font-bold text-[#171A1C] ml-1">View</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }
            if (activeTab === 'posts') {
              return <PostCard post={item as Post} />;
            }
            if (activeTab === 'groups') {
              const group = item as Group;
              return (
                <TouchableOpacity
                  className="bg-[#202A2D] p-4 mx-4 mb-2.5 rounded-2xl border border-[#3A4B4D] active:bg-[#2B3940]"
                  onPress={() => router.push(`/groups/${group.id}`)}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Image
                        source={{
                          uri:
                            group.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              group.name
                            )}&background=2B3940&color=D9D0B8`,
                        }}
                        style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#3A4B4D' }}
                        contentFit="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="font-bold text-sm text-[#D9D0B8]">{group.name}</Text>
                        <Text className="text-xs text-[#A8AAA0]">
                          {group.members_count || group.members?.length || 1}/10 members
                        </Text>
                      </View>
                    </View>
                    <View className="px-3 py-1 bg-[#496D6B]/30 border border-[#496D6B] rounded-xl">
                      <Text className="text-xs font-semibold text-[#D9D0B8]">Circle</Text>
                    </View>
                  </View>
                  {group.description ? (
                    <Text className="text-xs text-[#A8AAA0]" numberOfLines={2}>
                      {group.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }
            return null;
          }}
        />
      )}
    </View>
  );
}
