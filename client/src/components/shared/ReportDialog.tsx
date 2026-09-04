import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useDialogStore } from '../../stores/dialogStore.js';
import { Button } from '../ui/button.js';

export interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedType: 'POST' | 'COMMENT' | 'USER' | 'STORY' | 'MESSAGE';
  reportedId: string;
  targetTitle?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS: { id: string; label: string; description: string }[] = [
  {
    id: 'SPAM',
    label: 'Spam or Misleading',
    description: 'Scam links, commercial spam, repetitive or unsolicited bulk content',
  },
  {
    id: 'HARASSMENT',
    label: 'Harassment or Bullying',
    description: 'Targeted attacks, insults, intimidation, or personal abuse',
  },
  {
    id: 'HATE',
    label: 'Hate Speech',
    description: 'Direct attacks on protected characteristics, hateful imagery or slurs',
  },
  {
    id: 'VIOLENCE',
    label: 'Violence or Harm',
    description: 'Threats of violence, encouragement of self-harm, or graphic content',
  },
  {
    id: 'NUDITY',
    label: 'Nudity or Sexual Content',
    description: 'Explicit sexual images, non-consensual content, or inappropriate media',
  },
  {
    id: 'ILLEGAL',
    label: 'Scams or Illegal Activity',
    description: 'Phishing, malicious URLs, fraud, or prohibited goods and services',
  },
  {
    id: 'OTHER',
    label: 'Other Issue',
    description: 'Violations of community safety guidelines not covered above',
  },
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  reportedType,
  reportedId,
  targetTitle,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('SPAM');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useDialogStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/reports', {
        reported_type: reportedType,
        reported_id: reportedId,
        reason: selectedReason,
        details: details.trim(),
      });

      const message = res.data?.message || 'Report submitted. Our moderation team will review it.';
      toast.success(message);
      onSuccess?.();
      onClose();
      // Reset state
      setSelectedReason('SPAM');
      setDetails('');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Failed to submit report. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const humanReadableType = reportedType.charAt(0) + reportedType.slice(1).toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 shadow-2xl animate-slide-up text-[#D9D0B8] relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3A4B4D]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B87568]/20 border border-[#B87568]/40 text-[#B87568]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#D9D0B8]">
                {targetTitle || `Report ${humanReadableType}`}
              </h3>
              <p className="text-xs text-[#A8AAA0]">
                Help us keep Orbit safe and welcoming for everyone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8AAA0] mb-2">
              Why are you reporting this?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#D0A56A]/10 border-[#D0A56A] text-[#D9D0B8]'
                        : 'bg-[#171A1C]/50 border-[#3A4B4D] text-[#A8AAA0] hover:bg-[#2B3940]/50 hover:text-[#D9D0B8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 text-[#D0A56A] focus:ring-[#D0A56A] bg-[#202A2D] border-[#3A4B4D]"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-[#D9D0B8]">{r.label}</div>
                      <div className="text-xs text-[#A8AAA0] mt-0.5 leading-relaxed">
                        {r.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8AAA0] mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Provide any context that will help our moderators investigate..."
              rows={3}
              className="w-full rounded-xl bg-[#171A1C] border border-[#3A4B4D] px-3.5 py-2.5 text-sm text-[#D9D0B8] placeholder:text-[#A8AAA0]/60 focus:outline-none focus:border-[#D0A56A] transition-colors resize-none"
            />
            <div className="text-right text-[11px] text-[#A8AAA0] mt-1">
              {details.length}/500
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#B87568]/10 border border-[#B87568]/20 text-[#D9D0B8] text-xs">
            <AlertTriangle className="h-4 w-4 text-[#B87568] shrink-0 mt-0.5" />
            <span className="text-[#A8AAA0]">
              Content receiving multiple distinct reports is automatically hidden pending human
              investigation. False or abusive reporting may result in account penalties.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#3A4B4D]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="bg-[#B87568] hover:bg-[#C98679] text-[#171A1C] font-semibold"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
