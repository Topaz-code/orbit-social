import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';
import {
  Heart,
  MessageSquare,
  UserPlus,
  Bell,
  CheckCheck,
  PhoneCall,
  Sparkles,
} from 'lucide-react-native';
import { SkeletonNotification } from '../../components/ui/Skeleton';

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    isRefetching,
    isError,
    refetch,
    markRead,
    markAllRead,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color="#B87568" fill="#B87568" />;
      case 'comment':
        return <MessageSquare size={16} color="#D0A56A" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus size={16} color="#496D6B" />;
      case 'call':
        return <PhoneCall size={16} color="#71877B" />;
      default:
        return <Bell size={16} color="#D0A56A" />;
    }
  };

  return (
    <View className="flex-1 bg-[#171A1C]">
      {/* Header Actions */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#3A4B4D]/60">
        <Text className="text-xs font-semibold uppercase tracking-wider text-[#A8AAA0]">
          Activity & Alerts
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            className="flex-row items-center space-x-1 bg-[#202A2D] px-2.5 py-1 rounded-lg border border-[#3A4B4D] active:bg-[#2B3940]"
            onPress={() => markAllRead()}
          >
            <CheckCheck size={14} color="#D0A56A" />
            <Text className="text-[11px] text-[#D0A56A] font-medium ml-1">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/*
        FIX 3 — the skeleton renders the INSTANT `isLoading` is true (i.e. only
        when there is no cached data). With the 30s `staleTime` in
        useNotifications this appears once on a cold open and then the tab is
        served from cache, instead of blocking on the network every visit.
      */}
      {isLoading ? (
        <View className="pt-4">
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
        </View>
      ) : isError && notifications.length === 0 ? (
        <View className="items-center justify-center py-20 px-6">
          <Bell size={36} color="#B87568" className="mb-3" />
          <Text className="text-base font-bold text-[#D9D0B8]">
            Could not load your alerts
          </Text>
          <TouchableOpacity
            className="mt-4 bg-[#D0A56A] px-5 py-2.5 rounded-xl active:opacity-85"
            onPress={() => refetch()}
          >
            <Text className="text-sm font-bold text-[#171A1C]">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          // Defensive key: a missing/duplicate id must never crash the list.
          keyExtractor={(item, index) =>
            item?.id ? String(item.id) : `notification-${index}`
          }
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-row items-start p-3.5 mx-4 mb-2.5 rounded-2xl border ${
                item.is_read
                  ? 'bg-[#1C2224] border-[#2B3940]'
                  : 'bg-[#202A2D] border-[#3A4B4D]'
              }`}
              onPress={() => markRead(item.id)}
            >
              <View className="w-9 h-9 rounded-xl bg-[#2B3940] border border-[#3A4B4D] items-center justify-center mr-3 mt-0.5">
                {getNotificationIcon(item.type)}
              </View>
              <View className="flex-1">
                <Text className="text-xs text-[#D9D0B8] leading-relaxed">
                  <Text className="font-bold">{item.actor?.display_name || 'Someone'} </Text>
                  {item.content || item.message || 'interacted with your Orbit'}
                </Text>
                <Text className="text-[10px] text-[#7F8B86] mt-1">
                  {new Date(item.created_at || Date.now()).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!item.is_read && (
                <View className="w-2 h-2 rounded-full bg-[#D0A56A] mt-2 ml-2" />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <Sparkles size={36} color="#496D6B" className="mb-3" />
              <Text className="text-base font-bold text-[#D9D0B8]">All caught up!</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                When people like your posts or send friend requests, you will see alerts here.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={Boolean(isRefetching)}
              onRefresh={() => refetch()}
              tintColor="#D0A56A"
              colors={['#D0A56A']}
            />
          }
        />
      )}
    </View>
  );
}
