import { prisma } from '../config/database.js';

// Blacklisted malicious domains / IP loggers / known phishing domains
const MALICIOUS_DOMAIN_PATTERNS = [
  /grabify\.link/i,
  /iplogger\.(org|com|ru)/i,
  /2no\.co/i,
  /yip\.su/i,
  /blasze\.com/i,
  /psportable\.com/i,
  /free-crypto-giveaway\./i,
  /claim-nitro\./i,
  /discord-nitro-gift\./i,
  /steam-gift-cards\./i,
  /login-secure-auth\./i,
  /verify-wallet-connect\./i,
  /meta-mask-auth\./i,
];

// Dangerous file extensions in URLs
const SUSPICIOUS_URL_EXTENSIONS = /\.(exe|bat|cmd|vbs|ps1|scr|pif|jar)(\?|$)/i;

// Prohibited / Spam Keywords and Phrases
const SPAM_KEYWORD_PATTERNS = [
  /\b(free\s+crypto|send\s+(btc|eth|usdt)\s+to)\b/i,
  /\b(whatsapp\s+me\s+at\s+[\+\d\s\(\)-]{7,}|dm\s+me\s+on\s+telegram\s+@[\w\d_]+)\b/i,
  /\b(make\s+\$\d+[\d,]*\s+(daily|hourly|a day|working from home))\b/i,
  /\b(100%\s+guaranteed\s+profit|guaranteed\s+returns\s+crypto)\b/i,
  /\b(viagra|cialis|buy\s+cheap\s+meds)\b/i,
  /\b(claim\s+your\s+free\s+\$\d+\s+gift\s+card)\b/i,
  /\b(wire\s+transfer\s+western\s+union)\b/i,
];

// Severe violation keywords (harassment, hate, violence)
const SEVERE_VIOLATION_PATTERNS = [
  /\b(kill\s+yourself|kys|die\s+in\s+a\s+hole)\b/i,
  /\b(child\s+porn|cp\s+links|pedophile|csam)\b/i,
  /\b(bomb\s+threat|mass\s+shooting\s+plan)\b/i,
];

export interface ScanResult {
  isAllowed: boolean;
  reason?: string;
  flagType?: 'SPAM' | 'MALICIOUS_LINK' | 'HARASSMENT' | 'VIOLENCE' | 'AI_FLAGGED';
  autoHide?: boolean;
}

export const moderationService = {
  /**
   * Scans text content and URLs for violations (prohibited keywords, hate speech, phishing links).
   */
  async scanContent(text?: string | null, linkUrl?: string | null): Promise<ScanResult> {
    const combinedText = `${text || ''} ${linkUrl || ''}`.trim();
    if (!combinedText) {
      return { isAllowed: true };
    }

    // 1. Link Protection & Malicious URL Scanner
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matched = combinedText.match(urlRegex);
    const extractedUrls: string[] = matched ? Array.from(matched) : [];
    if (linkUrl) {
      extractedUrls.push(linkUrl);
    }

    for (const url of extractedUrls) {
      // Check malicious domains
      for (const pattern of MALICIOUS_DOMAIN_PATTERNS) {
        if (pattern.test(url)) {
          return {
            isAllowed: false,
            reason: 'Post blocked: contains a known malicious link or IP logger.',
            flagType: 'MALICIOUS_LINK',
          };
        }
      }

      // Check dangerous executable downloads
      if (SUSPICIOUS_URL_EXTENSIONS.test(url)) {
        return {
          isAllowed: false,
          reason: 'Post blocked: direct links to executable files (.exe, .scr, .bat) are prohibited.',
          flagType: 'MALICIOUS_LINK',
        };
      }
    }

    // 2. Severe Safety Violations Check
    for (const pattern of SEVERE_VIOLATION_PATTERNS) {
      if (pattern.test(combinedText)) {
        return {
          isAllowed: false,
          reason: 'Content violates Community Safety Guidelines (violent threats, self-harm, or severe harm).',
          flagType: 'VIOLENCE',
        };
      }
    }

    // 3. Spam and Financial Scam Check
    for (const pattern of SPAM_KEYWORD_PATTERNS) {
      if (pattern.test(combinedText)) {
        return {
          isAllowed: false,
          reason: 'Content blocked by automated anti-spam filter (unsolicited financial promotion or spam).',
          flagType: 'SPAM',
        };
      }
    }

    // 4. Optional OpenAI Moderation API (if key present in environment)
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ input: combinedText }),
        });

        if (response.ok) {
          const result: any = await response.json();
          const firstResult = result.results?.[0];
          if (firstResult?.flagged) {
            const categories = Object.entries(firstResult.categories || {})
              .filter(([_, val]) => Boolean(val))
              .map(([cat]) => cat)
              .join(', ');

            return {
              isAllowed: false,
              reason: `Content flagged by AI moderation: ${categories || 'Community standard violation'}`,
              flagType: 'AI_FLAGGED',
            };
          }
        }
      } catch {
        // Fall back gracefully if OpenAI API is unreachable or times out
      }
    }

    return { isAllowed: true };
  },

  /**
   * Auto-Hide Engine:
   * Called when a report is filed. Increments target report_count, and if >= 3 unique reports,
   * automatically hides the content and notifies platform administrators.
   */
  async handleNewReport(data: {
    reported_type: string;
    reported_id: string;
    reporter_id: string;
  }): Promise<{ autoHidden: boolean; totalReports: number }> {
    const { reported_type, reported_id, reporter_id } = data;
    const type = reported_type.toUpperCase();

    // Increment report_count on the target model
    try {
      if (type === 'POST') {
        await prisma.post.update({
          where: { id: reported_id },
          data: { report_count: { increment: 1 } },
        });
      } else if (type === 'COMMENT') {
        await prisma.comment.update({
          where: { id: reported_id },
          data: { report_count: { increment: 1 } },
        });
      } else if (type === 'STORY') {
        await prisma.story.update({
          where: { id: reported_id },
          data: { report_count: { increment: 1 } },
        });
      }
    } catch {
      // Target item may have already been deleted
    }

    // Count unique active reports for this target
    const totalReports = await prisma.report.count({
      where: {
        reported_type: type,
        reported_id: reported_id,
        status: { not: 'DISMISSED' },
      },
    });

    const AUTO_HIDE_THRESHOLD = 3;
    let autoHidden = false;

    if (totalReports >= AUTO_HIDE_THRESHOLD) {
      // Automatically hide content
      try {
        if (type === 'POST') {
          const post = await prisma.post.findUnique({ where: { id: reported_id } });
          if (post && post.status !== 'HIDDEN' && post.status !== 'REMOVED') {
            await prisma.post.update({
              where: { id: reported_id },
              data: { status: 'HIDDEN' },
            });
            autoHidden = true;
          }
        } else if (type === 'COMMENT') {
          const comment = await prisma.comment.findUnique({ where: { id: reported_id } });
          if (comment && comment.status !== 'HIDDEN' && comment.status !== 'REMOVED') {
            await prisma.comment.update({
              where: { id: reported_id },
              data: { status: 'HIDDEN' },
            });
            autoHidden = true;
          }
        } else if (type === 'STORY') {
          const story = await prisma.story.findUnique({ where: { id: reported_id } });
          if (story && story.status !== 'HIDDEN' && story.status !== 'REMOVED') {
            await prisma.story.update({
              where: { id: reported_id },
              data: { status: 'HIDDEN' },
            });
            autoHidden = true;
          }
        }

        if (autoHidden) {
          // Log auto-hide action
          await prisma.moderationLog.create({
            data: {
              admin_id: reporter_id,
              action: 'AUTO_HIDE',
              target_type: type,
              target_id: reported_id,
              reason: `Auto-hidden: reached ${totalReports} community reports.`,
            },
          });

          // Notify all admins and moderators
          const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'MODERATOR'] } },
            select: { id: true },
          });

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                user_id: admin.id,
                type: 'system',
                reference_id: reported_id,
                reference_type: type,
                content: `[ALERT] ${type} (${reported_id.slice(0, 8)}) was automatically HIDDEN after receiving ${totalReports} reports.`,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to execute auto-hide logic:', err);
      }
    }

    return { autoHidden, totalReports };
  },
};
