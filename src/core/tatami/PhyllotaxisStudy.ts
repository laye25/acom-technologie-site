import { TopologyGraph } from '../topology/TopologyGraph';
import { TatamiConfig, TatamiBlock, TatamiMetrics } from './types';
import { TatamiPlanner } from './TatamiPlanner';
import { AdaptiveTatamiCorrection, CorrectionReport } from './AdaptiveTatamiCorrection';
import { TatamiValidator } from './TatamiValidator';
import { CoverageAnalyzer } from './CoverageAnalyzer';

export interface StudyResult {
    regionId: string;
    originalBlock: TatamiBlock;
    correctedBlock: TatamiBlock;
    originalMetrics: TatamiMetrics;
    correctedMetrics: TatamiMetrics;
    correctionReport: CorrectionReport;
    gain: number;
}

export class PhyllotaxisStudy {
    /**
     * Runs a comparative study between standard Tatami and the 137.5° correction prototype.
     */
    public static runStudy(graph: TopologyGraph, config: TatamiConfig): StudyResult[] {
        const results: StudyResult[] = [];

        for (const region of graph.regions) {
            if (region.isHole) continue;

            // 1. Generate standard Tatami & analyze coverage
            const originalBlock = TatamiPlanner.plan(graph, region, config);
            const origCoverage = CoverageAnalyzer.analyze(originalBlock, region);
            const origValidatorMetrics = TatamiValidator.validate(originalBlock);

            const originalMetrics: TatamiMetrics = {
                ...origValidatorMetrics,
                gaps: Number((100 - origCoverage.coveragePercentage).toFixed(2))
            };

            // 2. Apply 137.5° experimental correction & analyze updated coverage
            const { correctedBlock, report } = AdaptiveTatamiCorrection.apply(originalBlock, region);
            const corrCoverage = CoverageAnalyzer.analyze(correctedBlock, region);
            const corrValidatorMetrics = TatamiValidator.validate(correctedBlock);

            const correctedMetrics: TatamiMetrics = {
                ...corrValidatorMetrics,
                gaps: Number((100 - corrCoverage.coveragePercentage).toFixed(2))
            };

            // 3. Compute gain (relative reduction in uncovered gap ratio)
            const origGap = 100 - origCoverage.coveragePercentage;
            const corrGap = 100 - corrCoverage.coveragePercentage;
            const gain = origGap > 0 ? (origGap - corrGap) / origGap : (corrCoverage.coveragePercentage > origCoverage.coveragePercentage ? 0.05 : 0);

            results.push({
                regionId: region.id,
                originalBlock,
                correctedBlock,
                originalMetrics,
                correctedMetrics,
                correctionReport: report,
                gain
            });
        }

        return results;
    }
}
