import type { DeviceRecord } from '../protocol/types.js';
export interface PairOptions {
    host: string;
    port?: number;
    user?: string;
    name?: string;
    onFingerprintPrompt?: (fingerprint: string, host: string) => Promise<boolean>;
    onManualKeyPrompt?: (pubKey: string, host: string, port: number) => Promise<boolean>;
}
export declare class PairingManager {
    static pairDevice(options: PairOptions): Promise<DeviceRecord>;
}
//# sourceMappingURL=pairing.d.ts.map