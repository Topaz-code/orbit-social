import React from 'react';
import { Dialog, DialogHeader, DialogTitle } from '../ui/dialog.js';
import { PostComposer } from './PostComposer.js';
import { useQueryClient } from '@tanstack/react-query';

interface PostComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl p-0 overflow-hidden">
      <div className="p-4 sm:p-6 pb-2">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <PostComposer
          className="border-none shadow-none p-0 mb-2"
          onPostCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            onOpenChange(false);
          }}
          onClose={() => onOpenChange(false)}
        />
      </div>
    </Dialog>
  );
};
