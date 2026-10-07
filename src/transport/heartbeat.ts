import { EventEmitter } from 'node:events';
import { createMessage } from '../protocol/parser.js';
import type { ProtocolMessage } from '../protocol/types.js';
import { DEFAULT_HEARTBEAT_INTERVAL_MS, DEFAULT_HEARTBEAT_TIMEOUT_MS } from '../protocol/constants.js';

export class HeartbeatMonitor extends EventEmitter {
  private intervalTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private latency = 0;
  private sendFn: (msg: ProtocolMessage) => void;
  private intervalMs: number;
  private timeoutMs: number;

  constructor(
    sendFn: (msg: ProtocolMessage) => void,
    intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
    timeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS
  ) {
    super();
    this.sendFn = sendFn;
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
  }

  public start(): void {
    this.stop();
    this.intervalTimer = setInterval(() => {
      this.sendPing();
    }, this.intervalMs);
    // Send immediate first ping
    this.sendPing();
  }

  private sendPing(): void {
    this.lastPingTime = Date.now();
    this.sendFn(createMessage('ping'));

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    this.timeoutTimer = setTimeout(() => {
      this.emit('timeout');
    }, this.timeoutMs);
  }

  public handlePong(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.latency = Date.now() - this.lastPingTime;
    this.emit('pong', this.latency);
  }

  public getLatency(): number {
    return this.latency;
  }

  public stop(): void {
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
