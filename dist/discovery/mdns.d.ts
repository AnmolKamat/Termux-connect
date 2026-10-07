import { EventEmitter } from 'node:events';
import type { DiscoveredDevice } from './udp.js';
/**
 * mDNS / Bonjour discovery using macOS native dns-sd
 */
export declare class MdnsScanner extends EventEmitter {
    private proc;
    private foundDevices;
    scan(timeoutMs?: number): Promise<DiscoveredDevice[]>;
    private resolveService;
    stop(): void;
}
//# sourceMappingURL=mdns.d.ts.map