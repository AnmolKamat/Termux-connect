/**
 * Android as Mac Webcam Capability (PRD §23)
 * Designed for modular extension without modifying the connection layer.
 */

export interface WebcamConfig {
  resolutionWidth: number;
  resolutionHeight: number;
  fps: number;
  cameraFacing: 'front' | 'back';
  microphoneEnabled: boolean;
}

export class WebcamCapability {
  public static isSupported(): boolean {
    return true;
  }

  public static getDefaultConfig(): WebcamConfig {
    return {
      resolutionWidth: 1920,
      resolutionHeight: 1080,
      fps: 30,
      cameraFacing: 'back',
      microphoneEnabled: true,
    };
  }
}
