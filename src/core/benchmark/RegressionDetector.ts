import { BenchmarkRecord } from './BenchmarkHistory';

export class RegressionDetector {
  static checkRegression(current: BenchmarkRecord, previous: BenchmarkRecord): string[] {
    const alerts: string[] = [];
    
    if (current.overallScore < previous.overallScore - 0.5) {
      alerts.push(`Overall score dropped from ${previous.overallScore} to ${current.overallScore}`);
    }
    
    if (current.failed > previous.failed) {
      alerts.push(`Failure count increased from ${previous.failed} to ${current.failed}`);
    }
    
    return alerts;
  }
}