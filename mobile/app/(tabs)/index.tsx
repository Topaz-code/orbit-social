import React from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFeed } from '../../hooks/useFeed';
import PostCard from '../../components/feed/PostCard';
import PostComposer from '../../components/feed/PostComposer';
import StoryList from '../../components/story/StoryList';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { SkeletonPost } from '../../components/ui/Skeleton';

export default function FeedScreen() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useFeed();

  const posts = data?.pages.flatMap((page: any) => page.posts || []) || [];

  return (
    <View className="flex-1 bg-[#171A1C]">
      {isLoading ? (
        <View className="p-4">
          <StoryList />
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center bg-[#171A1C] px-6 py-16">
          <Sparkles size={36} color="#D0A56A" className="mb-3" />
          <Text className="text-[#D9D0B8] font-bold text-base text-center">Unable to load feed</Text>
          <Text className="text-[#A8AAA0] text-xs text-center mt-1 mb-4">
            The Orbit backend may be waking up from sleep.
          </Text>
          <TouchableOpacity
            className="bg-[#D0A56A] px-5 py-2.5 rounded-xl flex-row items-center gap-2"
            onPress={() => refetch()}
          >
            <RefreshCw size={14} color="#171A1C" />
            <Text className="text-[#171A1C] font-bold text-xs ml-1.5">Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <>
              <StoryList />
              <PostComposer />
            </>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Sparkles size={32} color="#496D6B" className="mb-3" />
              <Text className="text-[#D9D0B8] font-bold text-base text-center">
                Your orbit is quiet
              </Text>
              <Text className="text-[#A8AAA0] text-xs text-center mt-1 max-w-xs">
                Follow friends or share your first post to start seeing chronological updates!
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="p-4">
                <SkeletonPost />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#D0A56A"
              colors={['#D0A56A']}
            />
          }
        />
      )}
    </View>
  );
}
