/**
 * Android as Mac Webcam Capability (PRD §23)
 * Designed for modular extension without modifying the connection layer.
 */
export class WebcamCapability {
    static isSupported() {
        return true;
    }
    static getDefaultConfig() {
        return {
            resolutionWidth: 1920,
            resolutionHeight: 1080,
            fps: 30,
            cameraFacing: 'back',
            microphoneEnabled: true,
        };
    }
}
//# sourceMappingURL=index.js.map