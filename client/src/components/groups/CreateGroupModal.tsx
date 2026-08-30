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
        <p className="text-xs text-slate-500 mt-1">
          Groups on Orbit are intentionally kept intimate with a strict maximum of{' '}
          <strong className="text-indigo-600 dark:text-indigo-400">{MAX_GROUP_MEMBERS} members</strong>.
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Privacy Setting
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPrivacy('public')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                privacy === 'public'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">Public</p>
                <p className="text-[10px] text-slate-400">Anyone can find and join</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPrivacy('private')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                privacy === 'private'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Lock className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">Private</p>
                <p className="text-[10px] text-slate-400">Invite only</p>
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
