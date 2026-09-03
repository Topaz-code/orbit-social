import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Sparkles, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState("What is your pet's name?");
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuthStore();

  const handleRegister = async () => {
    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        security_question: securityQuestion,
        security_answer: securityAnswer.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#171A1C]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-10">
        {/* Brand Header */}
        <View className="items-center mb-6">
          <View className="w-14 h-14 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-3">
            <Sparkles size={28} color="#D0A56A" />
          </View>
          <Text className="text-2xl font-bold text-[#D9D0B8] tracking-tight">Join Orbit</Text>
          <Text className="text-[#A8AAA0] text-xs mt-1">
            Privacy-first social platform for your true circle
          </Text>
        </View>

        {/* Card Container */}
        <View className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-6 shadow-xl mb-6">
          {error ? (
            <View className="bg-[#B87568]/20 border border-[#B87568] p-3 rounded-lg mb-4">
              <Text className="text-[#B87568] text-xs font-medium">{error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Username *
            </Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="e.g. alex_orbit"
              placeholderTextColor="#7F8B86"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Display Name */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Display Name *
            </Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="e.g. Alex Johnson"
              placeholderTextColor="#7F8B86"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address *
            </Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="alex@example.com"
              placeholderTextColor="#7F8B86"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone (Optional) */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Phone Number (Optional)
            </Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="+1234567890"
              placeholderTextColor="#7F8B86"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Password *
            </Text>
            <View className="relative">
              <TextInput
                className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm pr-12"
                placeholder="Min 6 characters"
                placeholderTextColor="#7F8B86"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color="#A8AAA0" /> : <Eye size={18} color="#A8AAA0" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-4">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
              Confirm Password *
            </Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="Re-enter password"
              placeholderTextColor="#7F8B86"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Security Answer */}
          <View className="mb-6">
            <Text className="text-[#D9D0B8] text-xs font-semibold uppercase tracking-wider mb-1">
              Security Question
            </Text>
            <Text className="text-[#D0A56A] text-xs font-medium mb-1.5">{securityQuestion}</Text>
            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-[#D9D0B8] text-sm"
              placeholder="Your answer (for password recovery)"
              placeholderTextColor="#7F8B86"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`bg-[#D0A56A] rounded-xl py-3.5 items-center justify-center shadow-lg ${
              loading ? 'opacity-80' : 'active:opacity-90'
            }`}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-[#171A1C] font-bold text-sm">
              {loading ? 'Creating Orbit Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Login Link */}
        <TouchableOpacity
          className="items-center mb-6"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-[#A8AAA0] text-sm">
            Already have an account?{' '}
            <Text className="text-[#D0A56A] font-bold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
