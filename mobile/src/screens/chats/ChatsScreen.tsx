import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { api } from '../../services/api';
import { Conversation, User } from '../../types';
import { socketService } from '../../services/socketService';
import { ChatConversationView } from './ChatConversationView';

export const ChatsScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setConversations(res.data.data);
      }
    } catch (e) {
      console.warn('[Chats] Fetch conversations error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const handleNewMessage = () => {
      fetchConversations();
    };

    socketService.on('chat_message', handleNewMessage);
    return () => {
      socketService.off('chat_message', handleNewMessage);
    };
  }, [fetchConversations]);

  if (activeChatUser) {
    return (
      <ChatConversationView
        targetUser={activeChatUser}
        onBack={() => {
          setActiveChatUser(null);
          fetchConversations();
        }}
      />
    );
  }

  const renderConversation = ({ item }: { item: Conversation }) => {
    const friendName = item.user?.display_name || item.user?.username || 'User';
    const initial = friendName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() =>
          setActiveChatUser({
            id: item.user.id,
            username: item.user.username,
            display_name: item.user.display_name,
            avatar_url: item.user.avatar_url,
            email: '',
            is_online: item.user.is_online,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {item.user?.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          {item.user?.is_online && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.convMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{friendName}</Text>
            {item.last_message?.created_at && (
              <Text style={styles.timestamp}>
                {new Date(item.last_message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          <View style={styles.snippetRow}>
            <Text style={styles.snippetText} numberOfLines={1}>
              {item.last_message?.content || 'Started a new conversation'}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#D0A56A" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConversations();
              }}
              tintColor="#D0A56A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Go to Friends tab and start a chat!</Text>
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
  listContent: {
    padding: 12,
  },
  convCard: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 18,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#202428',
  },
  convMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 12,
  },
  snippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetText: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#D0A56A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#171A1C',
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
});
