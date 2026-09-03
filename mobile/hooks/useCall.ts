import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useCall() {
  const queryClient = useQueryClient();

  const initiateCallMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post('/calls/initiate', { receiver_id: userId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', 'history'] });
    }
  });

  return { initiateCallMutation };
}
