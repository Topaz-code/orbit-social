import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

export default function OnboardingScreen() {
  const user = useAuthStore(state => state.user);
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        bio,
        privacy_settings: { private_account: isPrivate }
      });
      await checkAuth(); // Refresh user state
      router.replace('/(tabs)/');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-3xl font-bold text-indigo-600 mb-8 mt-12">Welcome to Orbit!</Text>
      
      <Text className="text-lg text-slate-700 mb-4">Let's set up your profile.</Text>
      
      <View className="mb-6">
        <Text className="text-sm font-medium text-slate-600 mb-2">Bio</Text>
        <View className="border border-slate-300 rounded-lg p-3 bg-slate-50">
          <Text className="text-slate-800">Add a short bio...</Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between mb-8">
        <View>
          <Text className="text-sm font-medium text-slate-600">Private Account</Text>
          <Text className="text-xs text-slate-400 mt-1">Only friends can see your posts</Text>
        </View>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: '#6366f1' }} />
      </View>
      
      <TouchableOpacity 
        className={`bg-indigo-600 py-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
        onPress={handleComplete}
        disabled={loading}
      >
        <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : 'Complete Setup'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
