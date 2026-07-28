// src/ai-demo/AuditLog/ActionLogger.ts
// Auditable log recorder for Acom AI operations

import { AcomActionLog } from '../types';

const STORAGE_KEY = 'acom_ai_action_logs';

class ActionLoggerService {
  private logs: AcomActionLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, 200)));
    } catch (err) {
      console.error('[ActionLogger] Failed to save logs', err);
    }
  }

  public log(entry: Omit<AcomActionLog, 'id' | 'timestamp'>): AcomActionLog {
    const fullLog: AcomActionLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(fullLog);
    this.saveLogs();
    return fullLog;
  }

  public getLogs(saasFilter?: string): AcomActionLog[] {
    if (saasFilter) {
      return this.logs.filter(l => l.saas === saasFilter);
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const ActionLogger = new ActionLoggerService();
