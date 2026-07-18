/**
 * @module VerseauExecutive
 * @description Executive Cortex (Cortex Préfrontal) of the Verseau cognitive system.
 * Formulates high-level engineering objectives, constraints, and priorities (Quality, Speed, Stability)
 * based on the machine type, thread type, and target fabric before triggering the Reasoner.
 * 
 * STATUS: Designed | Implemented | Tested | Benchmarked
 * RÈGLE 52 - MATURITÉ EXPLICITE : PRODUCTION STABLE
 */

export type ExecutivePriority = 'quality' | 'speed' | 'stability' | 'balance';
export type MachineBrand = 'Tajima' | 'Barudan' | 'Brother' | 'Happy' | 'Generic';
export type ThreadType = 'Polyester' | 'Rayon' | 'Cotton' | 'Metallic';

export interface ExecutiveObjective {
  targetFidelityScore: number; // 0 to 100
  speedCoefficient: number; // 0.1 to 1.0 (multiplier for speed)
  tearRiskTolerance: number; // 0 to 100 (risk threshold)
  vibrationTolerance: number; // 0 to 100
}

export interface ExecutiveDirective {
  priority: ExecutivePriority;
  machineBrand: MachineBrand;
  threadType: ThreadType;
  objectives: ExecutiveObjective;
  maxStitchSpeedRPM: number;
  tensionPresetGrams: number;
  isExoticCombination: boolean;
}

export class VerseauExecutive {
  /**
   * Formulates a strict, structured Executive Directive from high-level parameters.
   * Underpins the Prefrontal Cortex's capability to set constraints and objectives.
   * 
   * @param priority Targeted priority profile
   * @param machine Selected industrial machine
   * @param thread Thread material type
   * @param fabricKey Target fabric key
   * @returns ExecutiveDirective compiled target parameters
   */
  static formulateDirective(
    priority: ExecutivePriority,
    machine: MachineBrand,
    thread: ThreadType,
    fabricKey: string
  ): ExecutiveDirective {
    // 1. Determine machine characteristics
    let maxStitchSpeedRPM = 850;
    let tensionPresetGrams = 3.0;

    switch (machine) {
      case 'Tajima':
        maxStitchSpeedRPM = 1200; // Japanese precision high speed
        tensionPresetGrams = 2.8;
        break;
      case 'Barudan':
        maxStitchSpeedRPM = 1100; // Heavy duty force
        tensionPresetGrams = 3.2;
        break;
      case 'Brother':
        maxStitchSpeedRPM = 950;
        tensionPresetGrams = 2.7;
        break;
      case 'Happy':
        maxStitchSpeedRPM = 1000;
        tensionPresetGrams = 2.9;
        break;
      default:
        maxStitchSpeedRPM = 850;
        tensionPresetGrams = 3.0;
    }

    // Adjust tension based on thread type
    switch (thread) {
      case 'Metallic':
        tensionPresetGrams *= 0.8; // Lower tension required to avoid metallic wire snapping
        break;
      case 'Cotton':
        tensionPresetGrams *= 1.1; // Cotton needs firmer holds
        break;
      case 'Rayon':
        tensionPresetGrams *= 0.95; // Smooth silky rayon
        break;
      default:
        break;
    }

    // 2. Compute Target Objectives based on Priority and Materials
    let targetFidelityScore = 95;
    let speedCoefficient = 0.8;
    let tearRiskTolerance = 50;
    let vibrationTolerance = 50;

    if (priority === 'quality') {
      targetFidelityScore = 99;
      speedCoefficient = 0.5; // slow down for ultimate quality
      tearRiskTolerance = 10; // zero tolerance for tearing
      vibrationTolerance = 20;
    } else if (priority === 'speed') {
      targetFidelityScore = 88;
      speedCoefficient = 1.0; // full throttle
      tearRiskTolerance = 70;
      vibrationTolerance = 80;
    } else if (priority === 'stability') {
      targetFidelityScore = 93;
      speedCoefficient = 0.7;
      tearRiskTolerance = 30;
      vibrationTolerance = 30;
    } else {
      // Balance
      targetFidelityScore = 94;
      speedCoefficient = 0.8;
      tearRiskTolerance = 45;
      vibrationTolerance = 50;
    }

    // Material-driven limits on objectives
    if (fabricKey === 'silk') {
      tearRiskTolerance = Math.min(tearRiskTolerance, 15); // force very low tear tolerance on silk
      speedCoefficient = Math.min(speedCoefficient, 0.6); // force slower speed on silk
    } else if (fabricKey === 'leather') {
      tearRiskTolerance = Math.min(tearRiskTolerance, 25); // leather is irreversible, no high risk allowed
      speedCoefficient = Math.min(speedCoefficient, 0.7);
    }

    // 3. Detect "Exotic / Dangerous Combinations" (e.g. Metallic on Silk with high-speed / multi-layer)
    const isExoticCombination = 
      (thread === 'Metallic' && fabricKey === 'silk') ||
      (thread === 'Metallic' && fabricKey === 'leather') ||
      (priority === 'speed' && fabricKey === 'silk');

    return {
      priority,
      machineBrand: machine,
      threadType: thread,
      objectives: {
        targetFidelityScore,
        speedCoefficient,
        tearRiskTolerance,
        vibrationTolerance
      },
      maxStitchSpeedRPM,
      tensionPresetGrams: parseFloat(tensionPresetGrams.toFixed(2)),
      isExoticCombination
    };
  }
}
