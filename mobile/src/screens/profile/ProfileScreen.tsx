import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Orbit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const name = user?.display_name || user?.username || 'Orbit User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.handle}>@{user?.username || 'user'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {user?.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : (
          <Text style={styles.bioPlaceholder}>No bio provided yet.</Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.post_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.friend_count || 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>
      </View>

      {/* Security & Privacy info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Orbit Security</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>End-to-End Voice & Video</Text>
          <Text style={styles.infoValue}>Active 🛡️</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telecom CallKeep</Text>
          <Text style={styles.infoValue}>Self-Managed 📞</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Push Notifications</Text>
          <Text style={styles.infoValue}>FCM v1 ⚡</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#202428',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3339',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C3238',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#D0A56A',
  },
  avatarText: {
    color: '#D9D0B8',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: '#F3F4F6',
    fontSize: 22,
    fontWeight: '800',
  },
  handle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  email: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  bio: {
    color: '#E5E7EB',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  bioPlaceholder: {
    color: '#4B5563',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#2C3238',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#D0A56A',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2D3339',
  },
  infoCard: {
    backgroundColor: '#202428',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2D3339',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#D9D0B8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1D2125',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  infoValue: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '700',
  },
});
