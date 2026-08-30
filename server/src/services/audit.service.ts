import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface AuditRecord {
  id: string;
  timestamp: string;
  eventType: 'AUTH_LOGIN' | 'AUTH_FAILED' | 'AUTH_REGISTER' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED' | 'SECURITY_QUESTION_UPDATED' | 'PROFILE_UPDATED';
  userId?: string;
  username?: string;
  ipAddress: string;
  details?: Record<string, any>;
  prevHash: string;
  hash: string;
}

class AuditService {
  private lastHash: string = 'GENESIS_ORBIT_SECURITY_LEDGER_2026';
  private logFilePath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback to local logs
      }
    }
    this.logFilePath = path.join(dataDir, 'audit_ledger.jsonl');
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const content = fs.readFileSync(this.logFilePath, 'utf-8').trim();
        if (content) {
          const lines = content.split('\n');
          const lastLine = lines[lines.length - 1];
          if (lastLine) {
            const parsed = JSON.parse(lastLine);
            if (parsed.hash) {
              this.lastHash = parsed.hash;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Audit ledger initialization fallback to genesis hash');
    }
  }

  private computeHash(record: Omit<AuditRecord, 'hash'>): string {
    const payload = `${record.prevHash}|${record.timestamp}|${record.eventType}|${record.userId || ''}|${record.ipAddress}|${JSON.stringify(record.details || {})}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  public recordEvent(
    eventType: AuditRecord['eventType'],
    data: {
      userId?: string;
      username?: string;
      ipAddress: string;
      details?: Record<string, any>;
    }
  ): AuditRecord {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const prevHash = this.lastHash;

    const baseRecord = {
      id,
      timestamp,
      eventType,
      userId: data.userId,
      username: data.username,
      ipAddress: data.ipAddress,
      details: data.details,
      prevHash,
    };

    const hash = this.computeHash(baseRecord);
    const fullRecord: AuditRecord = { ...baseRecord, hash };

    this.lastHash = hash;

    // Append to immutable log file
    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(fullRecord) + '\n', 'utf-8');
    } catch {
      // In-memory ledger fallback
    }

    return fullRecord;
  }

  public verifyIntegrity(): { valid: boolean; totalRecords: number; errorIndex?: number } {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return { valid: true, totalRecords: 0 };
      }

      const content = fs.readFileSync(this.logFilePath, 'utf-8').trim();
      if (!content) return { valid: true, totalRecords: 0 };

      const lines = content.split('\n');
      let expectedPrevHash = 'GENESIS_ORBIT_SECURITY_LEDGER_2026';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const record: AuditRecord = JSON.parse(line);

        if (record.prevHash !== expectedPrevHash) {
          return { valid: false, totalRecords: lines.length, errorIndex: i };
        }

        const recomputed = this.computeHash({
          id: record.id,
          timestamp: record.timestamp,
          eventType: record.eventType,
          userId: record.userId,
          username: record.username,
          ipAddress: record.ipAddress,
          details: record.details,
          prevHash: record.prevHash,
        });

        if (recomputed !== record.hash) {
          return { valid: false, totalRecords: lines.length, errorIndex: i };
        }

        expectedPrevHash = record.hash;
      }

      return { valid: true, totalRecords: lines.length };
    } catch (err) {
      return { valid: false, totalRecords: 0 };
    }
  }
}

export const auditService = new AuditService();
