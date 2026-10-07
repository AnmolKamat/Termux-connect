import { EventEmitter } from 'node:events';
export interface DiscoveredDevice {
    id: string;
    name: string;
    model: string;
    host: string;
    port: number;
    capabilities: string[];
    source: 'udp' | 'mdns';
}
/**
 * UDP Scanner that broadcasts discovery requests on the local network
 * and collects responses from Android devices running android-sync-bridge.
 */
export declare class UdpScanner extends EventEmitter {
    private socket;
    private isScanning;
    private foundDevices;
    scan(timeoutMs?: number): Promise<DiscoveredDevice[]>;
    stop(): void;
}
//# sourceMappingURL=udp.d.ts.map