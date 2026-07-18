import { BenchmarkRunner } from './BenchmarkRunner';
import { ReportGenerator } from './ReportGenerator';
import { BenchmarkHistory } from './BenchmarkHistory';
import { FailureAnalyzer } from './FailureAnalyzer';
import { GoldenDataset } from '../../modules/tailleur/services/GoldenDataset';

console.log("Running ATCP Golden Dataset Certification Benchmark...");
console.log(`This will evaluate ${GoldenDataset.length} motifs against the Compiler Pipeline.`);

// Run the benchmark
const report = BenchmarkRunner.runGoldenBenchmark();
const latestRecord = BenchmarkHistory.getLatest();

if (latestRecord) {
  console.log(`\nCertification complete.`);
  console.log(`Overall Engine Score: ${latestRecord.overallScore.toFixed(2)}`);
  console.log(`Passed: ${latestRecord.passed} / ${latestRecord.total}`);
  
  // Generate HTML & Badge
  ReportGenerator.generateHTML(latestRecord);
  ReportGenerator.generateBadge(latestRecord);
  console.log(`Report generated in ./benchmark-history/`);
  
  // Analyze Failures
  if (latestRecord.failed > 0) {
    console.log(`Analyzing ${latestRecord.failed} failures...`);
    FailureAnalyzer.analyze(report.reportList, latestRecord);
    console.log(`Failure analysis generated in ./benchmark-history/ failures folder.`);
  }
}
