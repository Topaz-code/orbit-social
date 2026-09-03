import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useStories } from '../../hooks/useStories';
import { useAuthStore } from '../../stores/authStore';
import { Plus } from 'lucide-react-native';

export default function StoryList() {
  const { user } = useAuthStore();
  const { stories } = useStories();

  return (
    <View className="bg-[#171A1C] py-3 mb-2 border-b border-[#3A4B4D]/60">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Add Story Button matching screenshot */}
        <TouchableOpacity
          className="items-center mr-4 active:opacity-85"
          onPress={() => router.push('/stories/create')}
        >
          <View className="relative w-16 h-16 rounded-full border-2 border-dashed border-[#3A4B4D] items-center justify-center mb-1.5 bg-[#202A2D]">
            <Plus size={22} color="#D0A56A" strokeWidth={2.5} />
            <View className="absolute bottom-0 right-0 bg-[#D0A56A] rounded-full p-1 border-2 border-[#171A1C]">
              <Plus size={10} color="#171A1C" strokeWidth={3} />
            </View>
          </View>
          <Text className="text-[11px] text-[#D9D0B8] font-medium text-center">Add Story</Text>
        </TouchableOpacity>

        {/* Friends' Stories */}
        {stories?.map((group: any) => {
          const userObj = group.user || group;
          return (
            <TouchableOpacity
              key={userObj.id || group.id}
              className="items-center mr-4 active:opacity-85"
              onPress={() => router.push('/stories/viewer')}
            >
              <View className="w-16 h-16 rounded-full border-2 border-[#D0A56A] p-[2.5px] mb-1.5">
                <Image
                  source={{
                    uri:
                      userObj.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userObj.display_name || 'Story'
                      )}&background=2B3940&color=D9D0B8`,
                  }}
                  style={{ width: '100%', height: '100%', borderRadius: 30 }}
                  contentFit="cover"
                />
              </View>
              <Text className="text-[11px] text-[#D9D0B8] text-center max-w-[64px]" numberOfLines={1}>
                {userObj.display_name || userObj.username || 'Friend'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
