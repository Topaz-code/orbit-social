import React, { useState } from 'react';
import { User } from '../../types/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Textarea } from '../ui/textarea.js';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const { updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
      });
      setErrorMessage(null);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 text-[#D9D0B8]">
        {errorMessage && (
          <div className="p-3 text-xs font-medium text-[#B87568] bg-[#B87568]/15 rounded-xl border border-[#B87568]/30">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-[#D9D0B8] mb-1">
            Display Name
          </label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#D9D0B8] mb-1">
            Bio
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell friends what you're into..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#D9D0B8] mb-1">
            Phone Number
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 123 4567"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940]">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] rounded-[10px] font-semibold">
            Save Changes
          </Button>
        </DialogFooter>
      </form>

    </Dialog>
  );
};
