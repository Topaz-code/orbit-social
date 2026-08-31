import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups.js';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Textarea } from '../ui/textarea.js';
import { Globe, Lock, ShieldAlert } from 'lucide-react';
import { MAX_GROUP_MEMBERS } from '../../lib/constants.js';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { createGroup, isCreating } = useGroups();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setErrorMessage(null);

    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        privacy,
      });
      setName('');
      setDescription('');
      setErrorMessage(null);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Could not create group. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create a Group</DialogTitle>
        <p className="text-xs text-[#A8AAA0] mt-1">
          Groups on Orbit are intentionally kept intimate with a strict maximum of{' '}
          <strong className="text-[#D0A56A]">{MAX_GROUP_MEMBERS} members</strong>.
        </p>

      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Group Name
          </label>
          <Input
            type="text"
            placeholder="e.g. Photography Club"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <Textarea
            placeholder="What is this group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A8AAA0] mb-1.5">
            Privacy Setting
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPrivacy('public')}
              className={`flex items-center gap-2.5 p-3 rounded-[10px] border text-left transition-all ${
                privacy === 'public'
                  ? 'border-[#496D6B] bg-[#2B3940] text-[#D9D0B8] font-semibold'
                  : 'border-[#3A4B4D] text-[#A8AAA0] hover:bg-[#2B3940]'
              }`}
            >
              <Globe className="h-4 w-4 flex-shrink-0 text-[#D0A56A]" />
              <div>
                <p className="text-xs font-bold text-[#D9D0B8]">Public</p>
                <p className="text-[10px] text-[#A8AAA0]">Anyone can find and join</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPrivacy('private')}
              className={`flex items-center gap-2.5 p-3 rounded-[10px] border text-left transition-all ${
                privacy === 'private'
                  ? 'border-[#496D6B] bg-[#2B3940] text-[#D9D0B8] font-semibold'
                  : 'border-[#3A4B4D] text-[#A8AAA0] hover:bg-[#2B3940]'
              }`}
            >
              <Lock className="h-4 w-4 flex-shrink-0 text-[#D0A56A]" />
              <div>
                <p className="text-xs font-bold text-[#D9D0B8]">Private</p>
                <p className="text-[10px] text-[#A8AAA0]">Invite only</p>
              </div>
            </button>
          </div>
        </div>


        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating} disabled={!name.trim()}>
            Create Group
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
