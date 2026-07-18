export interface ProfilerEntry {
  runId: string;
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsageMB?: number;
  layersCount?: number;
  stitchesCount?: number;
  contoursCount?: number;
  dexieAccesses?: number;
  eventsPublished?: number;
}

export class PerformanceProfiler {
  private static entries: ProfilerEntry[] = [];
  private static runStats: Record<string, {
    totalDuration: number;
    dexieAccesses: number;
    eventsPublished: number;
  }> = {};

  static startStep(runId: string, stepName: string): { end: (meta?: any) => void } {
    const startTime = Date.now();
    return {
      end: (meta: any = {}) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Memory usage heuristic (if available in browser environment)
        let memMB = 0;
        if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
          memMB = Math.round((window.performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }

        const stats = this.runStats[runId] || { totalDuration: 0, dexieAccesses: 0, eventsPublished: 0 };

        const entry: ProfilerEntry = {
          runId,
          stepName,
          startTime,
          endTime,
          duration,
          memoryUsageMB: memMB,
          layersCount: meta.layersCount,
          stitchesCount: meta.stitchesCount,
          contoursCount: meta.contoursCount,
          dexieAccesses: stats.dexieAccesses,
          eventsPublished: stats.eventsPublished
        };

        this.entries.push(entry);

        if (!this.runStats[runId]) {
          this.runStats[runId] = { totalDuration: 0, dexieAccesses: 0, eventsPublished: 0 };
        }
        this.runStats[runId].totalDuration += duration;
        
        console.log(`[Profiler] [${runId}] ${stepName.padEnd(30, '.')} ${duration} ms`);
        
        // Reset counters for the next step so we only count accesses within the step
        this.runStats[runId].dexieAccesses = 0;
        this.runStats[runId].eventsPublished = 0;
      }
    };
  }

  static trackDexieAccess(runId: string) {
    if (!this.runStats[runId]) this.runStats[runId] = { totalDuration: 0, dexieAccesses: 0, eventsPublished: 0 };
    this.runStats[runId].dexieAccesses++;
  }

  static trackEventPublished(runId?: string) {
    if (!runId) return;
    if (!this.runStats[runId]) this.runStats[runId] = { totalDuration: 0, dexieAccesses: 0, eventsPublished: 0 };
    this.runStats[runId].eventsPublished++;
  }

  static generateReport(runId: string) {
    const runEntries = this.entries.filter(e => e.runId === runId);
    if (runEntries.length === 0) {
      console.log(`[Profiler] No entries found for RUN_ID: ${runId}`);
      return;
    }

    let totalDuration = 0;
    
    console.log(`\n==================================================`);
    console.log(`⏱️  PERFORMANCE PROFILER REPORT - RUN_ID: ${runId}`);
    console.log(`==================================================\n`);
    
    runEntries.forEach(e => {
      const paddedName = e.stepName.padEnd(30, '.');
      console.log(`${paddedName} ${e.duration} ms`);
      totalDuration += e.duration;
    });

    console.log(`\n--------------------------------------------------`);
    console.log(`TOTAL PIPELINE TIME: ........... ${totalDuration} ms`);
    console.log(`--------------------------------------------------\n`);
    
    console.log(`📊 TIME MATRIX (Percentage of Total Time)`);
    runEntries.forEach(e => {
      const pct = totalDuration > 0 ? ((e.duration / totalDuration) * 100).toFixed(2) : '0.00';
      const paddedName = e.stepName.padEnd(50, '.');
      console.log(`${paddedName} ${pct.padStart(6, ' ')} %  (${e.duration} ms)`);
    });
    
    console.log(`\n==================================================\n`);
    return runEntries;
  }
}
