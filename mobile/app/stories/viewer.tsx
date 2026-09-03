import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useStories } from '../../hooks/useStories';
import { X, Eye } from 'lucide-react-native';
import { Skeleton } from '../../components/ui/Skeleton';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const { stories, isLoading } = useStories();
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatStories = stories.flatMap((g: any) => g.stories || [g]);
  const currentStory = flatStories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;
    const timer = setTimeout(() => {
      if (currentIndex < flatStories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        router.back();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentIndex, flatStories.length, currentStory]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Skeleton width="100%" height="80%" borderRadius={24} />
      </View>
    );
  }

  if (!currentStory) {
    return (
      <View className="flex-1 bg-[#171A1C] justify-center items-center px-6">
        <Text className="text-[#D9D0B8] font-bold text-base mb-3">No active stories</Text>
        <TouchableOpacity
          className="bg-[#D0A56A] px-5 py-2.5 rounded-xl active:opacity-85"
          onPress={() => router.back()}
        >
          <Text className="text-[#171A1C] font-bold text-xs">Back to Orbit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      {/* Story Image */}
      <Image
        source={{
          uri:
            currentStory.media_url ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />

      {/* Progress Bar */}
      <View className="absolute top-10 left-4 right-4 flex-row space-x-1 z-20">
        {flatStories.map((_: any, i: number) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full mx-0.5 ${
              i === currentIndex
                ? 'bg-[#D0A56A]'
                : i < currentIndex
                ? 'bg-white/80'
                : 'bg-white/30'
            }`}
          />
        ))}
      </View>

      {/* Top Author Row */}
      <View className="absolute top-14 left-4 right-4 flex-row items-center justify-between z-20">
        <View className="flex-row items-center space-x-2.5">
          <Image
            source={{
              uri:
                currentStory.user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  currentStory.user?.display_name || 'Story'
                )}&background=2B3940&color=D9D0B8`,
            }}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}
            contentFit="cover"
          />
          <View className="ml-2">
            <Text className="text-white font-bold text-xs shadow-xs">
              {currentStory.user?.display_name || currentStory.user?.username || 'Story'}
            </Text>
            <Text className="text-white/70 text-[10px]">
              {new Date(currentStory.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-black/50 p-2 rounded-full active:opacity-75"
          onPress={() => router.back()}
        >
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Caption at Bottom */}
      {currentStory.caption ? (
        <View className="absolute bottom-10 left-4 right-4 bg-black/60 p-4 rounded-2xl z-20">
          <Text className="text-white text-sm leading-relaxed">{currentStory.caption}</Text>
        </View>
      ) : null}

      {/* Tap zones for Next/Previous story */}
      <View className="absolute inset-0 flex-row z-10">
        <TouchableOpacity
          className="flex-1 h-full"
          onPress={() => {
            if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
          }}
        />
        <TouchableOpacity
          className="flex-1 h-full"
          onPress={() => {
            if (currentIndex < flatStories.length - 1) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              router.back();
            }
          }}
        />
      </View>
    </View>
  );
}
