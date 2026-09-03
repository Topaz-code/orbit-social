import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import PostCard from '../../components/feed/PostCard';
import { SkeletonPost } from '../../components/ui/Skeleton';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}`);
      return res.data?.data;
    },
    enabled: !!postId,
  });

  return (
    <ScrollView className="flex-1 bg-[#171A1C] pt-3">
      <Stack.Screen
        options={{
          title: 'Orbit Post',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {isLoading ? (
        <View className="p-4">
          <SkeletonPost />
        </View>
      ) : !post ? (
        <View className="flex-1 justify-center items-center py-20 px-6">
          <Text className="text-[#D9D0B8] font-bold">Post not found</Text>
        </View>
      ) : (
        <PostCard post={post} />
      )}
    </ScrollView>
  );
}
