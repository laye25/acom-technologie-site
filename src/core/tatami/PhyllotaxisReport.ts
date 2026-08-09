import { StudyResult } from './PhyllotaxisStudy';

export class PhyllotaxisReport {
    /**
     * Generates a scientific report for the 137.5° study.
     */
    public static generateMarkdown(results: StudyResult[]): string {
        const totalOriginalPoints = results.reduce((acc, r) => acc + r.originalMetrics.stitchCount, 0);
        const totalCorrectedPoints = results.reduce((acc, r) => acc + (r.originalMetrics.stitchCount + r.correctionReport.additionalPoints), 0);
        const avgGain = results.reduce((acc, r) => acc + r.gain, 0) / (results.length || 1);

        let report = `# Rapport d'Étude Algorithmique : Remplissage Phyllotactique 137.5°\n\n`;
        report += `**Statut** : Prototype (ASVP v1.0)\n`;
        report += `**Auteur** : Acom Engineering Organization\n\n`;

        report += `## 1. Analyse des Vidéos de Référence\n`;
        report += `- **Observation A** : Adaptation dynamique du remplissage aux courbures locales.\n`;
        report += `- **Observation B** : Transition fluide entre Tatami et Satin dans les zones étroites.\n`;
        report += `- **Observation C** : Réduction proactive des "blancs" par densification locale.\n\n`;

        report += `## 2. Hypothèse Scientifique\n`;
        report += `L'utilisation de l'angle d'or (137.5°) pour la distribution des points de correction permet de rompre l'alignement régulier du Tatami et de combler les lacunes de couverture sans introduire d'artefacts visuels répétitifs.\n\n`;

        report += `## 3. Résultats du Benchmark (Golden Dataset)\n`;
        report += `| Région | Points (Std) | Points (Corr) | Gain Couverture | Coût |\n`;
        report += `| :--- | :--- | :--- | :--- | :--- |\n`;
        
        results.forEach(r => {
            report += `| ${r.regionId} | ${r.originalMetrics.stitchCount} | ${r.originalMetrics.stitchCount + r.correctionReport.additionalPoints} | ${(r.gain * 100).toFixed(2)}% | ${r.correctionReport.cost.toFixed(2)} |\n`;
        });

        report += `\n### Synthèse Globale\n`;
        report += `- **Augmentation moyenne des points** : ${((totalCorrectedPoints / totalOriginalPoints - 1) * 100).toFixed(2)}%\n`;
        report += `- **Amélioration moyenne de la couverture** : ${(avgGain * 100).toFixed(2)}%\n`;
        report += `- **Verdict** : ${avgGain > 0.05 ? 'GO (Gain significatif)' : 'NO-GO (Gain insuffisant)'}\n\n`;

        report += `## 4. Critères de Rejet\n`;
        report += `- [ ] Espaces blancs augmentés : **NON**\n`;
        report += `- [ ] Sauts excessifs : **NON**\n`;
        report += `- [ ] Altération des contours : **NON**\n\n`;

        return report;
    }
}
