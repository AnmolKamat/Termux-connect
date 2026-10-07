import { EventEmitter } from 'node:events';
import type { ProtocolMessage } from '../protocol/types.js';
export declare class HeartbeatMonitor extends EventEmitter {
    private intervalTimer;
    private timeoutTimer;
    private lastPingTime;
    private latency;
    private sendFn;
    private intervalMs;
    private timeoutMs;
    constructor(sendFn: (msg: ProtocolMessage) => void, intervalMs?: number, timeoutMs?: number);
    start(): void;
    private sendPing;
    handlePong(): void;
    getLatency(): number;
    stop(): void;
}
//# sourceMappingURL=heartbeat.d.ts.map