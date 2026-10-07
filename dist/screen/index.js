/**
 * Screen Mirroring & Control Capability (PRD §21, §22)
 * Designed for modular extension without modifying the connection layer.
 */
export class ScreenCapability {
    static isSupported() {
        return true;
    }
    static getDefaultConfig() {
        return {
            resolutionWidth: 1080,
            resolutionHeight: 2400,
            fps: 30,
            bitrateKbps: 4000,
        };
    }
}
//# sourceMappingURL=index.js.map