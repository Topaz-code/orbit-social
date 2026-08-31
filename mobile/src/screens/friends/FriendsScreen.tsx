import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { api } from '../../services/api';
import { Friend, FriendRequest } from '../../types';
import { startOutgoingCall } from '../../services/callService';

export const FriendsScreen: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  const fetchFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests').catch(() => ({ data: { data: [] } })),
      ]);

      if (friendsRes.data?.success && Array.isArray(friendsRes.data.data)) {
        setFriends(friendsRes.data.data);
      }
      if (requestsRes.data?.success && Array.isArray(requestsRes.data.data)) {
        setRequests(requestsRes.data.data);
      }
    } catch (e) {
      console.warn('[Friends] Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleCall = (friend: Friend, type: 'voice' | 'video') => {
    startOutgoingCall(friend.id, friend.display_name || friend.username, type);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      fetchFriends();
    } catch (e) {
      console.warn('[Friends] Accept error:', e);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.post(`/friends/reject/${requestId}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      console.warn('[Friends] Reject error:', e);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.display_name?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q)
    );
  });

  const renderFriend = ({ item }: { item: Friend }) => {
    const name = item.display_name || item.username;
    const initial = name.charAt(0).toUpperCase();

    return (
      <View style={styles.friendCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          {item.is_online && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.friendMeta}>
          <Text style={styles.friendName}>{name}</Text>
          <Text style={styles.friendHandle}>@{item.username}</Text>
        </View>

        {/* Quick Call Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.voiceCallButton}
            onPress={() => handleCall(item, 'voice')}
            activeOpacity={0.7}
          >
            <Text style={styles.callIconText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.videoCallButton}
            onPress={() => handleCall(item, 'video')}
            activeOpacity={0.7}
          >
            <Text style={styles.callIconText}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => {
    const name = item.user?.display_name || item.user?.username || 'User';

    return (
      <View style={styles.friendCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.friendMeta}>
          <Text style={styles.friendName}>{name}</Text>
          <Text style={styles.friendHandle}>@{item.user?.username}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.rejectText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBoxContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {requests.length > 0 ? `(${requests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#D0A56A" />
        </View>
      ) : activeTab === 'friends' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchFriends();
              }}
              tintColor="#D0A56A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No friends found</Text>
              <Text style={styles.emptySubtitle}>Search users to grow your Orbit circle!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No pending requests</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  searchBoxContainer: {
    padding: 12,
    backgroundColor: '#202428',
    borderBottomWidth: 1,
    borderColor: '#2D3339',
  },
  searchInput: {
    backgroundColor: '#171A1C',
    color: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1D2125',
    borderBottomWidth: 1,
    borderColor: '#2D3339',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#D0A56A',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#D0A56A',
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202428',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2D3339',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2C3238',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3E464F',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#D9D0B8',
    fontSize: 17,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#202428',
  },
  friendMeta: {
    flex: 1,
  },
  friendName: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  friendHandle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  videoCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },
  callIconText: {
    fontSize: 16,
  },
  acceptButton: {
    backgroundColor: '#D0A56A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptText: {
    color: '#171A1C',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectText: {
    color: '#F3F4F6',
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#D9D0B8',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 13,
  },
});
