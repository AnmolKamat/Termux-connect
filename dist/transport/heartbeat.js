import { EventEmitter } from 'node:events';
import { createMessage } from '../protocol/parser.js';
import { DEFAULT_HEARTBEAT_INTERVAL_MS, DEFAULT_HEARTBEAT_TIMEOUT_MS } from '../protocol/constants.js';
export class HeartbeatMonitor extends EventEmitter {
    intervalTimer = null;
    timeoutTimer = null;
    lastPingTime = 0;
    latency = 0;
    sendFn;
    intervalMs;
    timeoutMs;
    constructor(sendFn, intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS, timeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS) {
        super();
        this.sendFn = sendFn;
        this.intervalMs = intervalMs;
        this.timeoutMs = timeoutMs;
    }
    start() {
        this.stop();
        this.intervalTimer = setInterval(() => {
            this.sendPing();
        }, this.intervalMs);
        // Send immediate first ping
        this.sendPing();
    }
    sendPing() {
        this.lastPingTime = Date.now();
        this.sendFn(createMessage('ping'));
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        this.timeoutTimer = setTimeout(() => {
            this.emit('timeout');
        }, this.timeoutMs);
    }
    handlePong() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        this.latency = Date.now() - this.lastPingTime;
        this.emit('pong', this.latency);
    }
    getLatency() {
        return this.latency;
    }
    stop() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
    }
}
//# sourceMappingURL=heartbeat.js.map