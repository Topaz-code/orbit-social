import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Shield, Lock, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react-native';
import api from '../../lib/api';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setError('Please enter your username, email, or phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchQuestion = async () => {
    if (!resetIdentifier.trim()) {
      Alert.alert('Error', 'Please enter your username or email');
      return;
    }
    try {
      setResetLoading(true);
      setError('');
      const res = await api.get(`/auth/security-question?identifier=${encodeURIComponent(resetIdentifier.trim())}`);
      setSecurityQuestion(res.data?.data?.security_question || "What is your pet's name?");
    } catch (e: any) {
      setError(e.response?.data?.message || 'User not found');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!securityAnswer.trim() || !newPassword) {
      Alert.alert('Error', 'Please answer the security question and enter a new password');
      return;
    }
    try {
      setResetLoading(true);
      setError('');
      await api.post('/auth/reset-password', {
        identifier: resetIdentifier.trim(),
        security_answer: securityAnswer.trim(),
        new_password: newPassword,
      });
      setResetSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setIsResetMode(false);
        setSecurityQuestion(null);
        setResetSuccess('');
      }, 2000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#171A1C]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-10">
        {/* Brand Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-4">
            <Sparkles size={32} color="#D0A56A" />
          </View>
          <Text className="text-3xl font-bold text-[#D9D0B8] tracking-tight">Orbit</Text>
          <Text className="text-[#D0A56A] font-semibold text-sm mt-1">Your circle. Your rules.</Text>
          <Text className="text-[#A8AAA0] text-xs mt-1 text-center max-w-xs">
            Chronological, ad-free, private social connection.
          </Text>
        </View>

        {/* Card Container */}
        <View className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-6 shadow-xl">
          {!isResetMode ? (
            <>
              <Text className="text-xl font-bold text-[#D9D0B8] mb-1">Welcome back</Text>
              <Text className="text-xs text-[#A8AAA0] mb-5">Sign in to your account to continue</Text>

              {error ? (
                <View className="bg-[#B87568]/20 border border-[#B87568] p-3 rounded-lg mb-4">
                  <Text className="text-[#B87568] text-xs font-medium">{error}</Text>
                </View>
              ) : null}

              {/* Identifier Input */}
              <View className="mb-4">
                <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-2">
                  Username, Email or Phone
                </Text>
                <TextInput
                  className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3.5 text-[#D9D0B8] text-sm"
                  placeholder="Enter your username, email or phone"
                  placeholderTextColor="#7F8B86"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View className="mb-2">
                <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-2">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3.5 text-[#D9D0B8] text-sm pr-12"
                    placeholder="Enter your password"
                    placeholderTextColor="#7F8B86"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-3.5"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#A8AAA0" />
                    ) : (
                      <Eye size={18} color="#A8AAA0" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                className="self-end mb-6 mt-1"
                onPress={() => {
                  setIsResetMode(true);
                  setError('');
                }}
              >
                <Text className="text-xs text-[#D0A56A] font-medium">Forgot password?</Text>
              </TouchableOpacity>

              {/* Login Submit Button */}
              <TouchableOpacity
                className={`bg-[#D0A56A] rounded-xl py-3.5 items-center justify-center shadow-lg ${
                  loading ? 'opacity-80' : 'active:opacity-90'
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text className="text-[#171A1C] font-bold text-sm">
                  {loading ? 'Connecting to Orbit...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Password Reset Mode */
            <>
              <View className="flex-row items-center gap-2 mb-4">
                <KeyRound size={20} color="#D0A56A" />
                <Text className="text-lg font-bold text-[#D9D0B8]">Reset Password</Text>
              </View>

              {resetSuccess ? (
                <View className="bg-[#496D6B]/30 border border-[#496D6B] p-3 rounded-lg mb-4">
                  <Text className="text-[#D9D0B8] text-xs">{resetSuccess}</Text>
                </View>
              ) : null}

              {error ? (
                <View className="bg-[#B87568]/20 border border-[#B87568] p-3 rounded-lg mb-4">
                  <Text className="text-[#B87568] text-xs font-medium">{error}</Text>
                </View>
              ) : null}

              {!securityQuestion ? (
                <View className="space-y-4">
                  <View>
                    <Text className="text-[#D9D0B8] text-xs font-semibold uppercase mb-2">
                      Username or Email
                    </Text>
                    <TextInput
                      className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
                      placeholder="Enter username or email"
                      placeholderTextColor="#7F8B86"
                      value={resetIdentifier}
                      onChangeText={setResetIdentifier}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity
                    className={`bg-[#D0A56A] rounded-xl py-3.5 items-center mt-2 ${
                      resetLoading ? 'opacity-80' : 'active:opacity-90'
                    }`}
                    onPress={handleFetchQuestion}
                    disabled={resetLoading}
                  >
                    <Text className="text-[#171A1C] font-bold text-sm">
                      {resetLoading ? 'Checking...' : 'Find Security Question'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-4">
                  <Text className="text-[#D9D0B8] text-xs font-semibold uppercase mb-1">
                    Security Question
                  </Text>
                  <Text className="text-[#D0A56A] text-sm font-medium mb-3">{securityQuestion}</Text>

                  <View className="mb-3">
                    <Text className="text-[#D9D0B8] text-xs font-semibold uppercase mb-1">
                      Your Answer
                    </Text>
                    <TextInput
                      className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
                      placeholder="Enter your security answer"
                      placeholderTextColor="#7F8B86"
                      value={securityAnswer}
                      onChangeText={setSecurityAnswer}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-[#D9D0B8] text-xs font-semibold uppercase mb-1">
                      New Password
                    </Text>
                    <TextInput
                      className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
                      placeholder="Enter new password (min 6 characters)"
                      placeholderTextColor="#7F8B86"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    className={`bg-[#D0A56A] rounded-xl py-3.5 items-center ${
                      resetLoading ? 'opacity-80' : 'active:opacity-90'
                    }`}
                    onPress={handleResetPassword}
                    disabled={resetLoading}
                  >
                    <Text className="text-[#171A1C] font-bold text-sm">
                      {resetLoading ? 'Saving...' : 'Save New Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                className="items-center mt-4"
                onPress={() => {
                  setIsResetMode(false);
                  setSecurityQuestion(null);
                  setError('');
                }}
              >
                <Text className="text-xs text-[#A8AAA0]">Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer Register Link */}
        <TouchableOpacity
          className="items-center mt-6"
          onPress={() => router.push('/(auth)/register')}
        >
          <Text className="text-[#A8AAA0] text-sm">
            Don't have an account?{' '}
            <Text className="text-[#D0A56A] font-bold">Create Orbit Account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
