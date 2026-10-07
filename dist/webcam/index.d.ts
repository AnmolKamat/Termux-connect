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
export declare class WebcamCapability {
    static isSupported(): boolean;
    static getDefaultConfig(): WebcamConfig;
}
//# sourceMappingURL=index.d.ts.map