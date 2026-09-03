import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { X, Check, Users, Search } from 'lucide-react-native';
import { SkeletonUser } from '../../components/ui/Skeleton';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['searchUsersGroup', search],
    queryFn: async () => {
      if (!search.trim()) {
        const res = await api.get('/users/discover');
        return res.data?.data || [];
      }
      const res = await api.get(`/search?q=${encodeURIComponent(search.trim())}&type=people`);
      return res.data?.data || [];
    },
  });

  const toggleUser = (user: any) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      if (selectedUsers.length >= 9) {
        Alert.alert('Limit Reached', 'Strict maximum of 10 members per Orbit circle.');
        return;
      }
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please give your circle a name.');
      return;
    }

    try {
      setIsCreating(true);
      const res = await api.post('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        initial_member_ids: selectedUsers.map((u) => u.id),
      });
      const newGroup = res.data?.data;
      if (newGroup?.id) {
        router.replace(`/groups/${newGroup.id}`);
      } else {
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'Create Micro Circle',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Cancel',
          headerRight: () => (
            <TouchableOpacity
              className={`bg-[#D0A56A] px-4 py-1.5 rounded-xl ${
                isCreating || !name.trim() ? 'opacity-60' : 'active:opacity-85'
              }`}
              onPress={handleCreateGroup}
              disabled={isCreating || !name.trim()}
            >
              <Text className="text-[#171A1C] font-bold text-xs">
                {isCreating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="p-4 bg-[#141819] border-b border-[#3A4B4D]">
        {/* Name Input */}
        <TextInput
          className="bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-base font-bold mb-2.5"
          placeholder="Circle Name (e.g. Design Inner Circle)"
          placeholderTextColor="#7F8B86"
          value={name}
          onChangeText={setName}
        />

        {/* Description Input */}
        <TextInput
          className="bg-[#202A2D] border border-[#3A4B4D] rounded-xl px-4 py-2.5 text-[#D9D0B8] text-xs mb-3"
          placeholder="Circle description (optional)"
          placeholderTextColor="#7F8B86"
          value={description}
          onChangeText={setDescription}
        />

        {/* Selected Members Count */}
        <Text className="text-xs font-semibold uppercase text-[#A8AAA0] mb-2">
          Members ({selectedUsers.length + 1}/10 limit)
        </Text>

        {selectedUsers.length > 0 && (
          <View className="flex-row flex-wrap mb-2">
            {selectedUsers.map((u) => (
              <TouchableOpacity
                key={u.id}
                className="bg-[#496D6B]/40 border border-[#496D6B] rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center space-x-1"
                onPress={() => toggleUser(u)}
              >
                <Text className="text-xs text-[#D9D0B8] mr-1">{u.display_name || u.username}</Text>
                <X size={13} color="#D9D0B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-3.5 py-2">
          <Search size={15} color="#D0A56A" className="mr-2" />
          <TextInput
            className="flex-1 text-xs text-[#D9D0B8] ml-2"
            placeholder="Search connections to invite..."
            placeholderTextColor="#7F8B86"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* User Selection List */}
      {isLoading ? (
        <View className="p-4 space-y-2">
          <SkeletonUser />
          <SkeletonUser />
          <SkeletonUser />
        </View>
      ) : (
        <FlatList
          data={users || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSelected = !!selectedUsers.find((u) => u.id === item.id);
            return (
              <TouchableOpacity
                className="p-3.5 mb-2.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] flex-row items-center justify-between active:bg-[#2B3940]"
                onPress={() => toggleUser(item)}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Image
                    source={{
                      uri:
                        item.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.display_name || item.username
                        )}&background=2B3940&color=D9D0B8`,
                    }}
                    style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#3A4B4D' }}
                    contentFit="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-sm text-[#D9D0B8]">{item.display_name}</Text>
                    <Text className="text-xs text-[#A8AAA0]">@{item.username}</Text>
                  </View>
                </View>

                <View
                  className={`w-7 h-7 rounded-lg items-center justify-center border ${
                    isSelected
                      ? 'bg-[#D0A56A] border-[#D0A56A]'
                      : 'bg-[#2B3940] border-[#3A4B4D]'
                  }`}
                >
                  {isSelected && <Check size={16} color="#171A1C" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
