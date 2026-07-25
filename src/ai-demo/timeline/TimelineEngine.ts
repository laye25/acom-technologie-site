// src/ai-demo/timeline/TimelineEngine.ts
// TimelineEngine: Converts raw events into a structured visual timeline sequence with zooms, halos, and animations.

import { RecordedEvent, TimelineStep } from '../types';
import { AiEngine } from '../engines/AiEngine';

export class TimelineEngine {
  /**
   * Transforms raw events into step-by-step timeline sequence with visual effects
   */
  public static buildTimelineFromEvents(events: RecordedEvent[]): TimelineStep[] {
    if (!events || events.length === 0) return [];

    const steps: TimelineStep[] = [];
    let stepNumber = 1;

    events.forEach((evt, idx) => {
      // Group related key events (filter out repetitive mouse moves/inputs)
      if (evt.action === 'click' || evt.action === 'page_change' || evt.action === 'submit' || evt.action === 'delete' || evt.action === 'error') {
        const startTimeSec = Math.round(evt.timestampMs / 100) / 10;
        const durationSec = 3.0; // default step duration

        let title = '';
        let description = '';
        let narrationText = '';
        let effectOverlay: TimelineStep['effectOverlay'] = 'none';
        let zoomLevel = 1.0;

        switch (evt.action) {
          case 'page_change':
            title = `Ouverture : ${evt.page}`;
            description = `Accès au module ${evt.module} - Page ${evt.page}`;
            narrationText = `Bienvenue sur la page ${evt.page} du module ${evt.module}.`;
            zoomLevel = 1.0;
            break;

          case 'click':
            title = `Action : ${evt.buttonOrLabel}`;
            description = `Clic sur l'élément "${evt.buttonOrLabel}" (${evt.targetTag || 'Bouton'})`;
            narrationText = AiEngine.generateContextualNarration('click', evt.buttonOrLabel || 'Bouton', evt.page, idx, events.length);
            effectOverlay = 'green_halo';
            zoomLevel = 1.3;
            break;

          case 'submit':
            title = `Validation Formulaire`;
            description = `Enregistrement et validation des données transmises.`;
            narrationText = `Validez le formulaire pour enregistrer les modifications.`;
            effectOverlay = 'green_halo';
            zoomLevel = 1.1;
            break;

          case 'delete':
            title = `Suppression / Retrait`;
            description = `Suppression de l'élément sélectionné.`;
            narrationText = `Confirmez la suppression de l'élément.`;
            effectOverlay = 'red_halo';
            zoomLevel = 1.2;
            break;

          case 'error':
            title = `Signalement d'Erreur`;
            description = `Une alerte ou erreur a été détectée sur la page.`;
            narrationText = `Vérifiez les champs du formulaire puis réessayez.`;
            effectOverlay = 'red_halo';
            zoomLevel = 1.4;
            break;

          default:
            title = `Étape ${stepNumber}`;
            description = `Interaction sur ${evt.page}`;
            narrationText = `Procédez à l'étape suivante sur la page ${evt.page}.`;
            break;
        }

        steps.push({
          id: `step-${idx + 1}-${Date.now()}`,
          stepNumber: stepNumber++,
          startTimeSec,
          durationSec,
          title,
          description,
          narrationText,
          actionType: evt.action,
          x: evt.x,
          y: evt.y,
          zoomLevel,
          effectOverlay
        });
      }
    });

    return steps;
  }
}
