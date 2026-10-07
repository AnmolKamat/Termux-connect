import { EventEmitter } from 'node:events';
import { type DiscoveredDevice } from './udp.js';
export interface EnrichedDiscoveredDevice extends DiscoveredDevice {
    isPaired: boolean;
    pairedId?: string;
}
export declare class DiscoveryManager extends EventEmitter {
    private udpScanner;
    private mdnsScanner;
    /**
     * Performs a discovery scan across UDP and mDNS concurrently.
     */
    discover(timeoutMs?: number): Promise<EnrichedDiscoveredDevice[]>;
    stop(): void;
}
//# sourceMappingURL=manager.d.ts.map