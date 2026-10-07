import { EventEmitter } from 'node:events';
import type { DeviceRecord, ConnectionState, ProtocolMessage } from '../protocol/types.js';
export declare class ConnectionManager extends EventEmitter {
    private device;
    private sshClient;
    private state;
    private process;
    private parser;
    private heartbeat;
    private backoffIndex;
    private reconnectTimer;
    private shouldStayConnected;
    private pendingRequests;
    constructor(device: DeviceRecord);
    getState(): ConnectionState;
    getDevice(): DeviceRecord;
    private setState;
    private setupParser;
    private handleIncomingMessage;
    /**
     * Starts a persistent connection and handles auto-reconnect.
     */
    connect(): Promise<void>;
    private initiateConnection;
    send(msg: ProtocolMessage): boolean;
    /**
     * Invokes an RPC method on the remote device and awaits the response.
     */
    request<T = unknown>(capability: string, action: string, payload?: unknown, timeoutMs?: number): Promise<T>;
    private handleDisconnect;
    private disconnectCurrentProcess;
    private scheduleReconnect;
    cancelReconnect(): void;
    disconnect(): void;
}
//# sourceMappingURL=connection.d.ts.map