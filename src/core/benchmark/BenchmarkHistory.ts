export interface BenchmarkRecord {
  version: string;
  timestamp: string;
  overallScore: number;
  moduleScores: {
    geometry: number;
    topology: number;
    ribbon: number;
    tatami: number;
    satin: number;
    travel: number;
    performance: number;
  };
  passed: number;
  failed: number;
  total: number;
}

export class BenchmarkHistory {
  private static history: BenchmarkRecord[] = [];

  // In a real Node environment, this would read/write to a JSON file or database.
  // We'll keep it in memory for the preview, but provide the structure for persistence.
  
  static loadHistory(): BenchmarkRecord[] {
    try {
      const stored = localStorage.getItem('benchmark_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore if not in browser environment
    }
    
    // Provide a mocked history to show progress as requested by the user
    if (this.history.length === 0) {
      this.history = [
        {
          version: 'v0.3.0',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          overallScore: 98.11,
          moduleScores: { geometry: 98.5, topology: 99.0, ribbon: 97.2, tatami: 98.1, satin: 96.5, travel: 96.0, performance: 95.0 },
          passed: 975, failed: 25, total: 1000
        },
        {
          version: 'v0.4.0',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          overallScore: 98.77,
          moduleScores: { geometry: 99.0, topology: 99.5, ribbon: 98.0, tatami: 98.5, satin: 97.8, travel: 97.2, performance: 96.0 },
          passed: 988, failed: 12, total: 1000
        },
        {
          version: 'v0.5.0',
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
          overallScore: 99.08,
          moduleScores: { geometry: 99.42, topology: 100.0, ribbon: 98.77, tatami: 99.11, satin: 98.5, travel: 97.94, performance: 97.5 },
          passed: 995, failed: 5, total: 1000
        }
      ];
    }
    return this.history;
  }

  static addRecord(record: BenchmarkRecord) {
    this.history.push(record);
    try {
      localStorage.setItem('benchmark_history', JSON.stringify(this.history));
    } catch (e) {}
  }

  static getLatest(): BenchmarkRecord | null {
    const history = this.loadHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }
}