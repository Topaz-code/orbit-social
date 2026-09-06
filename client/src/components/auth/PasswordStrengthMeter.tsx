import React, { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { checkPasswordBreached } from '../../lib/pwnedPassword.js';

interface PasswordStrengthMeterProps {
  password: string;
  onValidationChange?: (isValid: boolean, isPwned: boolean) => void;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  onValidationChange,
}) => {
  const [breachedInfo, setBreachedInfo] = useState<{ isPwned: boolean; count: number }>({
    isPwned: false,
    count: 0,
  });
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  // Criteria checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedCriteria = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  // Calculate strength score (0 to 4)
  let score = 0;
  if (password.length > 0) {
    score = passedCriteria;
    if (password.length >= 12 && passedCriteria >= 3) {
      score = 4;
    }
  }

  // Debounced breach check via HaveIBeenPwned
  useEffect(() => {
    if (!password || password.length < 6) {
      setBreachedInfo({ isPwned: false, count: 0 });
      return;
    }

    setIsCheckingBreach(true);
    const timer = setTimeout(async () => {
      const result = await checkPasswordBreached(password);
      setBreachedInfo(result);
      setIsCheckingBreach(false);
      onValidationChange?.(passedCriteria >= 3 && !result.isPwned, result.isPwned);
    }, 600);

    return () => clearTimeout(timer);
  }, [password, passedCriteria, onValidationChange]);

  if (!password) return null;

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-[#B87568]', // Red
    'bg-[#B87568]', // Red
    'bg-[#D0A56A]', // Amber
    'bg-[#496D6B]', // Muted Teal
    'bg-[#71877B]', // Soft Emerald
  ];

  return (
    <div className="space-y-2 mt-2 pt-1 animate-fade-in text-xs">
      {/* Visual Strength Meter Bar */}
      <div className="flex items-center justify-between text-[11px] font-medium text-[#A8AAA0]">
        <span>Password strength:</span>
        <span className={score >= 3 && !breachedInfo.isPwned ? 'text-[#71877B]' : 'text-[#D0A56A]'}>
          {strengthLabels[score]}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#2B3940] rounded-full overflow-hidden p-0.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              score > index ? strengthColors[score] : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#7F8B86] pt-1">
        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#71877B]' : ''}`}>
          {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#71877B]' : ''}`}>
          {hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Uppercase letter</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#71877B]' : ''}`}>
          {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Number (0-9)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-[#71877B]' : ''}`}>
          {hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Special symbol (!@#$)</span>
        </div>
      </div>

      {/* Leaked Password Warning Alert */}
      {breachedInfo.isPwned && (
        <div className="rounded-lg bg-[#B87568]/15 border border-[#B87568]/40 p-2.5 text-[#B87568] flex items-start gap-2 animate-fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs">Pwned Password Detected!</p>
            <p className="text-[11px] leading-relaxed opacity-90">
              This password appeared in <strong>{breachedInfo.count.toLocaleString()}</strong> known data breaches. Please choose a different, unique password.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
