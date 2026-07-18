export interface ModuleScores {
  geometry: number;
  topology: number;
  ribbon: number;
  tatami: number;
  satin: number;
  travel: number;
  physics: number;
  performance: number;
}

export interface ConfidenceExplanation {
  score: number;
  contributions: {
    baseAverage: number;
    variancePenalty: number;
    topologyPenalty: number;
    physicsPenalty: number;
    engineDeductions: {
      geometry: number;
      topology: number;
      ribbon: number;
      tatami: number;
      satin: number;
      travel: number;
      physics: number;
    };
  };
  primaryDeductionCause: string;
  remediationAdvised: string;
}

export class GlobalScore {
  static calculate(scores: ModuleScores): number {
    // 20% Geometry, 15% Topology, 15% Ribbon, 15% Tatami, 10% Satin, 10% Travel, 10% Physics, 5% Performance
    const weights = {
      geometry: 0.20,
      topology: 0.15,
      ribbon: 0.15,
      tatami: 0.15,
      satin: 0.10,
      travel: 0.10,
      physics: 0.10,
      performance: 0.05
    };

    let overall = 0;
    overall += (scores.geometry || 0) * weights.geometry;
    overall += (scores.topology || 0) * weights.topology;
    overall += (scores.ribbon || 0) * weights.ribbon;
    overall += (scores.tatami || 0) * weights.tatami;
    overall += (scores.satin || 0) * weights.satin;
    overall += (scores.travel || 0) * weights.travel;
    overall += (scores.physics || 0) * weights.physics;
    overall += (scores.performance || 0) * weights.performance;

    return Number(overall.toFixed(2));
  }

  /**
   * Calculates the physical and mathematical Confidence Score (CS) of the compilation pipeline.
   * Based on weighted engine scores, penalty for topological mismatch, and pipeline coherence (variance penalty).
   * Ref: Rule 67 — Un moteur ne progresse jamais seul
   */
  static calculateConfidenceScore(scores: ModuleScores): number {
    const explanation = this.explainConfidenceScore(scores);
    return explanation.score;
  }

  /**
   * Computes a fully explainable confidence report with engine deductions and root cause.
   */
  static explainConfidenceScore(scores: ModuleScores): ConfidenceExplanation {
    const geo = scores.geometry ?? 100;
    const topo = scores.topology ?? 100;
    const rib = scores.ribbon ?? 100;
    const tat = scores.tatami ?? 100;
    const sat = scores.satin ?? 100;
    const tra = scores.travel ?? 100;
    const phy = scores.physics ?? 100;

    const coreScores = [geo, topo, rib, tat, sat, tra, phy];
    
    // 1. Base Average
    const baseAverage = coreScores.reduce((sum, val) => sum + val, 0) / coreScores.length;

    // 2. Coherence Variance Penalty (Rule 67)
    const variance = coreScores.reduce((sum, val) => sum + Math.pow(val - baseAverage, 2), 0) / coreScores.length;
    const stdDev = Math.sqrt(variance);
    const variancePenalty = stdDev * 0.45;

    // 3. Topology Outlier Penalty (Critical invariant)
    let topologyPenalty = 0;
    if (topo < 95) {
      topologyPenalty = (100 - topo) * 0.8;
    }

    // 4. Physics Outlier Penalty (Risk of breakage)
    let physicsPenalty = 0;
    if (phy < 90) {
      physicsPenalty = (100 - phy) * 0.6;
    }

    const score = Math.max(0, Math.min(100, Number((baseAverage - variancePenalty - topologyPenalty - physicsPenalty).toFixed(2))));

    // Calculate individual deductions from optimal 100%
    const engineDeductions = {
      geometry: 100 - geo,
      topology: 100 - topo,
      ribbon: 100 - rib,
      tatami: 100 - tat,
      satin: 100 - sat,
      travel: 100 - tra,
      physics: 100 - phy
    };

    // Determine the primary cause of deduction
    let primaryDeductionCause = "Optimal synchronization across all compiler modules.";
    let maxDeduction = 0;
    let worstEngine = "";

    Object.entries(engineDeductions).forEach(([engine, deduction]) => {
      if (deduction > maxDeduction) {
        maxDeduction = deduction;
        worstEngine = engine;
      }
    });

    if (maxDeduction > 2.0) {
      if (worstEngine === 'topology') {
        primaryDeductionCause = "Critical invariant failure in Topology Graph (Regions/Holes mismatch).";
      } else if (worstEngine === 'ribbon') {
        primaryDeductionCause = "Ribbon Centerline Width Drift / Medial Axis transform instability.";
      } else if (worstEngine === 'physics') {
        primaryDeductionCause = "Physical fabric stress threshold exceeded / threat snapping risk.";
      } else if (worstEngine === 'satin') {
        primaryDeductionCause = "Satin column lacing angles are uneven or crossing boundaries.";
      } else if (worstEngine === 'geometry') {
        primaryDeductionCause = "Geometric deformation detected (high Hausdorff/RMS distance).";
      } else if (worstEngine === 'tatami') {
        primaryDeductionCause = "Tatami fill density is suboptimal or pattern offset contains gaps.";
      } else if (worstEngine === 'travel') {
        primaryDeductionCause = "Suboptimal travel optimization path (high jump counts / bad transitions).";
      }
    } else if (variancePenalty > 3.0) {
      primaryDeductionCause = "Coherence discrepancy: Uncoordinated optimizations across multiple engines.";
    }

    // Recommended remediation
    let remediationAdvised = "No action required. Engine pipeline is perfectly balanced.";
    if (score < 95) {
      if (worstEngine === 'topology') {
        remediationAdvised = "Audit Region Tree Isomorphism. Avoid overlapping intersecting CAD contours.";
      } else if (worstEngine === 'ribbon') {
        remediationAdvised = "Adjust Ribbon NormalField and Corner Resolver coefficients.";
      } else if (worstEngine === 'physics') {
        remediationAdvised = "Increase pull-compensation factors or reduce high stitch tension zones.";
      } else if (worstEngine === 'satin') {
        remediationAdvised = "Refine satin width threshold values and smooth column lacing angles.";
      } else {
        remediationAdvised = "Run local calibration check on the Golden Dataset for this specimen.";
      }
    }

    return {
      score,
      contributions: {
        baseAverage,
        variancePenalty,
        topologyPenalty,
        physicsPenalty,
        engineDeductions
      },
      primaryDeductionCause,
      remediationAdvised
    };
  }
}
