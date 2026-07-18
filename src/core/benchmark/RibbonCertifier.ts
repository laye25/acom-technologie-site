import { GoldenDataset } from '../../modules/tailleur/services/GoldenDataset';
import { TopologyEngine } from '../topology/TopologyEngine';
import { RibbonEngine } from '../ribbon/RibbonEngine';
import { RibbonValidator } from '../ribbon/RibbonValidator';
import { RibbonMetrics } from '../ribbon/types';

export class RibbonCertifier {
    public static run() {
        console.log('--- ATCP Ribbon Engine Certification Campaign (SPR-003A) ---');
        let totalScore = 0;
        let count = 0;

        for (const motif of GoldenDataset) {
            console.log(`\nMotif: ${motif.name}`);
            try {
                // 1. Build Topology
                const graph = TopologyEngine.buildGraph(motif.contours);
                
                // 2. Build Ribbons
                const result = RibbonEngine.buildRibbons(graph);
                
                if (result.ribbons.length === 0) {
                    console.log(`  [FAIL] No ribbons generated.`);
                    continue;
                }

                // 3. Evaluate Metrics for each ribbon
                let motifScore = 0;
                for (let i = 0; i < result.ribbons.length; i++) {
                    const ribbon = result.ribbons[i];
                    // Re-run the robust validator
                    const metrics = RibbonValidator.validate(ribbon);
                    
                    console.log(`  Ribbon ${i + 1}/${result.ribbons.length}:`);
                    console.log(`    Continuity: ${metrics.continuity.toFixed(4)}`);
                    console.log(`    Width Error: ${metrics.widthError.toFixed(4)}`);
                    console.log(`    Rail Crossings: ${metrics.railCrossings}`);
                    console.log(`    Smoothness: ${metrics.smoothness.toFixed(4)}`);
                    console.log(`    Corner Quality: ${metrics.cornerScore.toFixed(4)}`);
                    console.log(`    Junction Quality: ${metrics.junctionScore.toFixed(4)}`);
                    
                    // Simple score calculation
                    let rScore = 100;
                    if (metrics.continuity < 0.99) rScore -= 20;
                    if (metrics.widthError > 1.0) rScore -= Math.min(20, metrics.widthError * 5);
                    if (metrics.railCrossings > 0) rScore -= 30 * metrics.railCrossings;
                    if (metrics.smoothness > 5) rScore -= 10;
                    
                    motifScore += rScore;
                }
                
                motifScore /= result.ribbons.length;
                console.log(`  => Motif Score: ${Math.max(0, motifScore).toFixed(2)}%`);
                totalScore += Math.max(0, motifScore);
                count++;
            } catch (err) {
                console.log(`  [ERROR] Execution failed: ${err}`);
            }
        }
        
        const avgScore = count > 0 ? totalScore / count : 0;
        console.log(`\n======================================================`);
        console.log(`FINAL RIBBON SCORE: ${avgScore.toFixed(2)}%`);
        console.log(`======================================================\n`);
    }
}
