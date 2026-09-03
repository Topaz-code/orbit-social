import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, Phone, Video, Users } from 'lucide-react-native';
import api from '../../lib/api';
import { useCall } from '../../hooks/useCall';

interface NewCallModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional conversation context for the call. */
  conversationId?: string;
}

interface Friend {
  id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  is_online?: boolean;
}

/**
 * NewCallModal
 * ---------------------------------------------------------------------------
 * Bottom-sheet style modal launched from the FAB on the Calls tab. Lets the
 * user search their friends list and start a voice or video call. The actual
 * call creation + navigation lives in useCall().startCall().
 * ---------------------------------------------------------------------------
 */
export default function NewCallModal({ visible, onClose, conversationId }: NewCallModalProps) {
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { startCall } = useCall();

  const { data: friends, isLoading } = useQuery<Friend[]>({
    queryKey: ['friends', 'for-calls'],
    queryFn: async () => {
      const res = await api.get('/friends');
      return res.data?.data || [];
    },
    enabled: visible,
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(friends) ? friends : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => {
      const name = (f?.display_name || '').toLowerCase();
      const handle = (f?.username || '').toLowerCase();
      return name.includes(q) || handle.includes(q);
    });
  }, [friends, search]);

  const initiate = async (friend: Friend, type: 'voice' | 'video') => {
    if (!friend?.id || busyId) return;
    try {
      setBusyId(`${friend.id}-${type}`);
      await startCall(friend.id, type, conversationId);
      onClose();
      setSearch('');
    } catch (err: any) {
      // Permission denials / connection failures surface from startCall.
      console.warn('Start call failed:', err?.message || err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Press-outside-to-dismiss backdrop */}
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        {/* Sheet content — capture touches so taps inside never dismiss */}
        <View
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => {}}
        >
          <SafeAreaView
            edges={['bottom']}
            className="bg-[#141819] rounded-t-3xl border-t border-[#3A4B4D] max-h-[82%]"
          >
            {/* Grabber + header */}
            <View className="items-center pt-2.5 pb-1">
              <View className="w-10 h-1 rounded-full bg-[#3A4B4D]" />
            </View>
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-base font-bold text-[#D9D0B8]">Start a new call</Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-1.5 rounded-full bg-[#202A2D] border border-[#3A4B4D] active:opacity-70"
                accessibilityLabel="Close"
              >
                <X size={18} color="#D9D0B8" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-5 pb-2">
              <View className="flex-row items-center bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-3">
                <Search size={16} color="#7F8B86" />
                <TextInput
                  className="flex-1 px-2.5 py-2.5 text-sm text-[#D9D0B8]"
                  placeholder="Search friends..."
                  placeholderTextColor="#7F8B86"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={16} color="#7F8B86" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* List */}
            {isLoading ? (
              <View className="py-14 items-center">
                <ActivityIndicator color="#D0A56A" />
                <Text className="text-xs text-[#A8AAA0] mt-3">Loading friends…</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View className="py-14 items-center px-8">
                <Users size={34} color="#496D6B" />
                <Text className="text-sm font-bold text-[#D9D0B8] mt-3">
                  {search ? 'No friends found' : 'No friends yet'}
                </Text>
                <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                  {search
                    ? 'Try a different name or @username.'
                    : 'Add friends to start private voice & video calls.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
                renderItem={({ item }) => {
                  const name = item.display_name || item.username || 'Orbit User';
                  const voiceBusy = busyId === `${item.id}-voice`;
                  const videoBusy = busyId === `${item.id}-video`;
                  return (
                    <View className="flex-row items-center px-2 py-2.5">
                      <View className="relative mr-3">
                        <Image
                          source={{
                            uri:
                              item.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                name
                              )}&background=2B3940&color=D9D0B8`,
                          }}
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 23,
                            borderWidth: 1,
                            borderColor: '#3A4B4D',
                          }}
                          contentFit="cover"
                        />
                        {item.is_online ? (
                          <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#141819]" />
                        ) : null}
                      </View>

                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-[#D9D0B8]" numberOfLines={1}>
                          {name}
                        </Text>
                        <Text className="text-[11px] text-[#A8AAA0]">
                          {item.is_online ? 'Online now' : 'Offline'}
                        </Text>
                      </View>

                      {/* Voice call */}
                      <TouchableOpacity
                        className="w-10 h-10 items-center justify-center rounded-full bg-[#202A2D] border border-[#3A4B4D] mr-2 active:bg-[#2B3940]"
                        onPress={() => initiate(item, 'voice')}
                        disabled={!!busyId}
                        accessibilityLabel={`Voice call ${name}`}
                      >
                        {voiceBusy ? (
                          <ActivityIndicator size="small" color="#D0A56A" />
                        ) : (
                          <Phone size={17} color="#496D6B" />
                        )}
                      </TouchableOpacity>

                      {/* Video call */}
                      <TouchableOpacity
                        className="w-10 h-10 items-center justify-center rounded-full bg-[#D0A56A] active:opacity-85"
                        onPress={() => initiate(item, 'video')}
                        disabled={!!busyId}
                        accessibilityLabel={`Video call ${name}`}
                      >
                        {videoBusy ? (
                          <ActivityIndicator size="small" color="#171A1C" />
                        ) : (
                          <Video size={17} color="#171A1C" />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </View>
      </Pressable>
    </Modal>
  );
}
