/**
 * UserCheck API & Offline Heuristics for Blocking Fake/Disposable Users
 * Reference: https://www.usercheck.com
 */

const KNOWN_DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'mailinator.com',
  'mailinater.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmailaddress.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'getairmail.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'emailondeck.com',
  'crazymailing.com',
  'maildrop.cc',
  'fakeinbox.com',
  'inboxbear.com',
  'minuteinbox.com',
  'nada.ltd',
  'burnermail.io',
  'tempinbox.com',
  'fakemailgenerator.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
  'discard.email',
  'discardmail.com',
  'spambog.com',
  'trashymail.com',
  'mytempemail.com',
  'mailnesia.com',
  'tempail.com',
  'burnermail.com',
  'internxt.com/temporary-email',
  'chacuo.net',
  '0-mail.com',
]);

export interface EmailVerificationResult {
  isAllowed: boolean;
  reason?: string;
  disposable?: boolean;
  mx?: boolean;
  blocklisted?: boolean;
}

export class UserCheckService {
  private apiKey: string | null = null;
  private readonly apiUrl = 'https://api.usercheck.com/email';

  constructor() {
    this.apiKey = process.env.USERCHECK_API_KEY || null;
    if (this.apiKey) {
      console.log('🛡️ UserCheck API anti-bot & disposable email protection initialized');
    } else {
      console.log('🛡️ UserCheck offline disposable email domain blocker active');
    }
  }

  /**
   * Validates an email address against disposable providers, blocklists, and MX records.
   */
  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const normalized = (email || '').trim().toLowerCase();
    const parts = normalized.split('@');
    if (parts.length !== 2 || !parts[1]) {
      return { isAllowed: false, reason: 'Invalid email address format' };
    }

    const domain = parts[1];

    // 1. Check offline fast-path blacklist
    if (KNOWN_DISPOSABLE_DOMAINS.has(domain)) {
      return {
        isAllowed: false,
        disposable: true,
        reason: 'Temporary and disposable email addresses are not permitted on Orbit. Please use a permanent email address.',
      };
    }

    // 2. Call UserCheck API if API key is configured
    if (this.apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${this.apiUrl}/${encodeURIComponent(normalized)}?include_mx=true`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as {
            disposable?: boolean;
            mx?: boolean;
            blocklisted?: boolean;
            status?: number;
          };

          if (data.disposable) {
            return {
              isAllowed: false,
              disposable: true,
              reason: 'Disposable email addresses are not permitted on Orbit. Please use a valid, permanent email address.',
            };
          }

          if (data.blocklisted) {
            return {
              isAllowed: false,
              blocklisted: true,
              reason: 'This email domain has been flagged for spam or abuse. Please use a different email address.',
            };
          }

          if (data.mx === false) {
            return {
              isAllowed: false,
              mx: false,
              reason: 'This email domain does not have valid mail exchange (MX) records.',
            };
          }

          return { isAllowed: true, disposable: false, mx: true, blocklisted: false };
        } else if (response.status === 401 || response.status === 403) {
          console.warn('[UserCheck] API key invalid or quota exceeded; relying on offline domain filter');
        }
      } catch (err: any) {
        console.warn('[UserCheck] Verification network timeout; falling back to offline domain checks');
      }
    }

    // 3. Fallback check for common disposable patterns
    if (
      domain.includes('tempmail') ||
      domain.includes('throwaway') ||
      domain.includes('disposable') ||
      domain.includes('fakeinbox') ||
      domain.includes('10minute')
    ) {
      return {
        isAllowed: false,
        disposable: true,
        reason: 'Temporary and disposable email addresses are not permitted on Orbit.',
      };
    }

    return { isAllowed: true };
  }
}

export const userCheckService = new UserCheckService();
