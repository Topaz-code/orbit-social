import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { mqttClient } from '../../lib/mqtt';
import { useAuthStore } from '../../stores/authStore';
import IncomingCallScreen from './IncomingCallScreen';
import { Call } from '../../types';
import api from '../../lib/api';

interface IncomingPayload {
  callId: string;
  caller?: Call['caller'];
  type?: 'voice' | 'video';
}

export default function IncomingCallListener() {
  const user = useAuthStore((state) => state.user);
  const [incoming, setIncoming] = useState<Call | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const topic = `orbit/call/${user.id}/incoming`;
    const unsubscribe = mqttClient.subscribe(topic, (_topic, messageBuf) => {
      try {
        const payload: IncomingPayload = JSON.parse(messageBuf.toString());
        if (!payload?.callId) return;
        setIncoming({
          id: payload.callId,
          caller_id: payload.caller?.id || '',
          receiver_id: user.id,
          type: payload.type || 'voice',
          status: 'calling',
          caller: payload.caller,
        });
      } catch (err) {
        console.error('[Orbit] Failed to parse incoming call payload', err);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  if (!incoming) return null;

  const accept = () => {
    const callId = incoming.id;
    const type = incoming.type || 'voice';
    setIncoming(null);
    api.put(`/calls/${callId}`, { status: 'ongoing' }).catch(() => {});
    router.push(`/call/${callId}?isInitiator=false&type=${type}`);
  };

  const reject = () => {
    api.put(`/calls/${incoming.id}`, { status: 'rejected' }).catch(() => {});
    setIncoming(null);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
      <IncomingCallScreen call={incoming} onAccept={accept} onReject={reject} />
    </View>
  );
}
