const fs = require('fs');
const file = 'src/ai-demo/recorders/ScreenRecorder.ts';
let code = fs.readFileSync(file, 'utf8');

const oldStart = `
  public async startCapture(
    resolution: DemoResolution = '1080p',
    fps: DemoFPS = 30
  ): Promise<boolean> {
    try {
      const dim = this.getResolutionDimensions(resolution);
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: dim.width, max: dim.width },
          height: { ideal: dim.height, max: dim.height },
          frameRate: { ideal: fps, max: fps }
        },
        audio: true
      };

      this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
`;

const newStart = `
  public async startCapture(
    resolution: DemoResolution = '1080p',
    fps: DemoFPS = 30
  ): Promise<boolean> {
    try {
      const dim = this.getResolutionDimensions(resolution);
      let displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: dim.width, max: dim.width },
          height: { ideal: dim.height, max: dim.height },
          frameRate: { ideal: fps, max: fps }
        },
        audio: true
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      } catch (err) {
        console.warn('Screen capture with audio failed, trying video only...', err);
        displayMediaOptions.audio = false;
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      }
`;

code = code.replace(oldStart.trim(), newStart.trim());

const oldStop = `
  public async stopCapture(): Promise<Blob | null> {
    if (!this.isRecording) return null;
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.cleanupStream();
          this.isRecording = false;
          this.isPaused = false;
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        this.cleanupStream();
        this.isRecording = false;
        resolve(null);
      }
    });
  }
`;

const newStop = `
  public async stopCapture(): Promise<Blob | null> {
    if (!this.isRecording) return null;
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const mimeType = this.mediaRecorder ? this.mediaRecorder.mimeType : 'video/webm';
          const blob = new Blob(this.recordedChunks, { type: mimeType || 'video/webm' });
          this.cleanupStream();
          this.isRecording = false;
          this.isPaused = false;
          resolve(blob.size > 0 ? blob : null);
        };
        try {
          this.mediaRecorder.stop();
        } catch (e) {
          resolve(null);
        }
      } else {
        this.cleanupStream();
        this.isRecording = false;
        resolve(null);
      }
    });
  }
`;

code = code.replace(oldStop.trim(), newStop.trim());
fs.writeFileSync(file, code);
