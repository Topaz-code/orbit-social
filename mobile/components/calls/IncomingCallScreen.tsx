import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Phone, PhoneOff } from 'lucide-react-native';
import { Call } from '../../types';

interface IncomingCallScreenProps {
  call: Call;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallScreen({ call, onAccept, onReject }: IncomingCallScreenProps) {
  return (
    <View className="flex-1 bg-black justify-between py-20 px-8 items-center absolute inset-0 z-50">
      <View className="items-center mt-12">
        <View className="w-32 h-32 rounded-full bg-slate-800 mb-6 overflow-hidden">
          {call.caller?.avatar_url && (
            <Image source={{ uri: call.caller.avatar_url }} className="w-full h-full" />
          )}
        </View>
        <Text className="text-white text-3xl font-bold mb-2">{call.caller?.display_name}</Text>
        <Text className="text-indigo-400 text-lg">Orbit {call.type === 'video' ? 'Video' : 'Audio'} Call</Text>
      </View>
      
      <View className="flex-row justify-around w-full max-w-sm mb-12">
        <TouchableOpacity 
          className="w-20 h-20 rounded-full bg-red-500 items-center justify-center"
          onPress={onReject}
        >
          <PhoneOff color="white" size={32} />
          <Text className="text-white font-bold mt-2 absolute -bottom-8">Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-20 h-20 rounded-full bg-green-500 items-center justify-center"
          onPress={onAccept}
        >
          <Phone color="white" size={32} />
          <Text className="text-white font-bold mt-2 absolute -bottom-8">Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
