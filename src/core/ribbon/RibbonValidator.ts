import { Ribbon, RibbonMetrics } from './types';

export class RibbonValidator {
    public static validate(ribbon: Ribbon): RibbonMetrics {
        // Continuity: Check for excessive distances between adjacent centerline points
        let continuityScore = 1.0;
        let ruptures = 0;
        const pts = ribbon.centerline;
        
        for (let i = 1; i < pts.length; i++) {
            const dist = Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
            // If jump is too large, we consider it a rupture (let's say 25.0 is the max expected for 1mm density if we are in 0.1mm units)
            if (dist > 50.0) {
                ruptures++;
                continuityScore = Math.max(0, continuityScore - 0.5);
            }
        }
        
        // WidthError: Compare distance between left and right rails to original widths
        let totalWidthError = 0;
        for (let i = 0; i < ribbon.widths.length; i++) {
            if (ribbon.leftRail[i] && ribbon.rightRail[i]) {
                const actualWidth = Math.hypot(
                    ribbon.leftRail[i].x - ribbon.rightRail[i].x,
                    ribbon.leftRail[i].y - ribbon.rightRail[i].y
                );
                const expectedWidth = ribbon.widths[i];
                totalWidthError += Math.abs(actualWidth - expectedWidth);
            }
        }
        const widthError = ribbon.widths.length > 0 ? totalWidthError / ribbon.widths.length : 0;
        
        // Rail Crossings: Find self-intersections in left and right rails
        let railCrossings = 0;
        railCrossings += this.countIntersections(ribbon.leftRail);
        railCrossings += this.countIntersections(ribbon.rightRail);
        
        // Smoothness: tangent variation
        let smoothness = 0;
        for (let i = 1; i < pts.length; i++) {
            if (pts[i].tangent && pts[i-1].tangent) {
                const dt = Math.hypot(pts[i].tangent!.x - pts[i-1].tangent!.x, pts[i].tangent!.y - pts[i-1].tangent!.y);
                smoothness += dt;
            }
        }
        smoothness = pts.length > 1 ? smoothness / (pts.length - 1) : 0;
        
        return {
            continuity: continuityScore,
            widthError: widthError,
            railCrossings: railCrossings,
            smoothness: Math.max(0, 1.0 - smoothness),
            cornerScore: 1.0, // TODO: refine
            junctionScore: 1.0 // TODO: refine
        };
    }

    private static countIntersections(rail: any[]): number {
        let count = 0;
        if (!rail || rail.length < 4) return 0;
        for (let i = 0; i < rail.length - 1; i++) {
            for (let j = i + 2; j < rail.length - 1; j++) {
                if (i === 0 && j === rail.length - 2 && this.pointsEqual(rail[0], rail[rail.length-1])) {
                    continue; // skip adjacent closed loop ends
                }
                if (this.segmentsIntersect(rail[i], rail[i+1], rail[j], rail[j+1])) {
                    count++;
                }
            }
        }
        return count;
    }
    
    private static pointsEqual(a: any, b: any) {
        return Math.abs(a.x - b.x) < 1e-5 && Math.abs(a.y - b.y) < 1e-5;
    }

    private static segmentsIntersect(p1: any, p2: any, p3: any, p4: any): boolean {
        const ccw = (A: any, B: any, C: any) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
    }
}
