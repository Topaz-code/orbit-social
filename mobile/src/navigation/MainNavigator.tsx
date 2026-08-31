import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ChatsScreen } from '../screens/chats/ChatsScreen';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

type TabType = 'feed' | 'chats' | 'friends' | 'profile';

export const MainNavigator: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');

  const renderContent = () => {
    switch (currentTab) {
      case 'feed':
        return <FeedScreen />;
      case 'chats':
        return <ChatsScreen />;
      case 'friends':
        return <FriendsScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>🪐</Text>
          <Text style={styles.headerTitle}>Orbit</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
      </View>

      {/* Main Tab Screen Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Luxury Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('feed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, currentTab === 'feed' && styles.activeTabIcon]}>
            📰
          </Text>
          <Text style={[styles.tabLabel, currentTab === 'feed' && styles.activeTabLabel]}>
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('chats')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, currentTab === 'chats' && styles.activeTabIcon]}>
            💬
          </Text>
          <Text style={[styles.tabLabel, currentTab === 'chats' && styles.activeTabLabel]}>
            Chats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('friends')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, currentTab === 'friends' && styles.activeTabIcon]}>
            👥
          </Text>
          <Text style={[styles.tabLabel, currentTab === 'friends' && styles.activeTabLabel]}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('profile')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, currentTab === 'profile' && styles.activeTabIcon]}>
            👤
          </Text>
          <Text style={[styles.tabLabel, currentTab === 'profile' && styles.activeTabLabel]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1D2125',
    borderBottomWidth: 1,
    borderColor: '#2D3339',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D9D0B8',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24282C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1D2125',
    borderTopWidth: 1,
    borderColor: '#2D3339',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
    marginBottom: 2,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#D0A56A',
    fontWeight: '700',
  },
});
