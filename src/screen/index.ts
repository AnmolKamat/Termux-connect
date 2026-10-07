/**
 * Screen Mirroring & Control Capability (PRD §21, §22)
 * Designed for modular extension without modifying the connection layer.
 */

export interface ScreenConfig {
  resolutionWidth: number;
  resolutionHeight: number;
  fps: number;
  bitrateKbps: number;
}

export type ScreenControlAction =
  | 'touch_down'
  | 'touch_up'
  | 'touch_move'
  | 'key_press'
  | 'key_back'
  | 'key_home'
  | 'key_recents'
  | 'volume_up'
  | 'volume_down';

export interface ScreenInputEvent {
  action: ScreenControlAction;
  x?: number;
  y?: number;
  keyCode?: number;
}

export class ScreenCapability {
  public static isSupported(): boolean {
    return true;
  }

  public static getDefaultConfig(): ScreenConfig {
    return {
      resolutionWidth: 1080,
      resolutionHeight: 2400,
      fps: 30,
      bitrateKbps: 4000,
    };
  }
}
