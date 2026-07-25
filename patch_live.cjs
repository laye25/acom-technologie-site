const fs = require('fs');
const file = 'src/ai-demo/services/LiveGuidanceEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const oldCode = `      // 2. Pause between steps for natural demonstration rhythm and play TTS audio
      const stepDurationMs = Math.max(1200, (activeStep.durationSec || 2.5) * 1000);
      const voiceConfig = VoiceEngine.getAvailableVoices('fr')[0];
      
      await new Promise<void>((resolve) => {
        let isResolved = false;
        const fallback = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        }, stepDurationMs);

        if (activeStep.narrationText) {
          VoiceEngine.speakText(activeStep.narrationText, voiceConfig, () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(fallback);
              resolve();
            }
          });
        } else {
          resolve(); // Resolve immediately if no text, fallback timeout is cleared implicitly as we resolve
        }
      });`;

const newCode = `      // 2. Pause between steps for natural demonstration rhythm and play TTS audio
      const stepDurationMs = Math.max(1200, (activeStep.durationSec || 2.5) * 1000);
      const voiceConfig = VoiceEngine.getAvailableVoices('fr')[0];
      
      const timerPromise = new Promise<void>(resolve => setTimeout(resolve, stepDurationMs));
      const audioPromise = new Promise<void>(resolve => {
        if (activeStep.narrationText) {
          VoiceEngine.speakText(activeStep.narrationText, voiceConfig, resolve);
        } else {
          resolve();
        }
      });

      // Wait for both the minimum step duration AND the audio to finish
      await Promise.all([timerPromise, audioPromise]);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync(file, code);
