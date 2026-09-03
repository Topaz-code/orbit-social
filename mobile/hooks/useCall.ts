import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../lib/api';
import { requestCallPermissions } from '../lib/permissions';

export function useCall() {
  const queryClient = useQueryClient();

  const initiateCallMutation = useMutation({
    mutationFn: async ({
      userId,
      type = 'voice',
      conversationId,
    }: {
      userId: string;
      type?: 'voice' | 'video';
      conversationId?: string;
    }) => {
      const { data } = await api.post('/calls', {
        receiver_id: userId,
        type,
        conversation_id: conversationId || '',
      });
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', 'history'] });
    },
  });

  const startCall = async (
    userId: string,
    type: 'voice' | 'video' = 'voice',
    conversationId?: string
  ) => {
    const granted = await requestCallPermissions(type);
    if (!granted) {
      throw new Error('Camera or microphone permission was denied.');
    }
    const call = await initiateCallMutation.mutateAsync({ userId, type, conversationId });
    if (call?.id) {
      router.push(`/call/${call.id}?isInitiator=true&type=${type}`);
    }
    return call;
  };

  return { initiateCallMutation, startCall };
}
