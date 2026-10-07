export declare class AndroidBridgeServer {
    private parser;
    private notificationWatcher;
    private broadcaster;
    private isStreaming;
    constructor();
    private setupParser;
    private send;
    private handleIncomingMessage;
    /**
     * Starts stream session over stdin/stdout (used when spawned over SSH)
     */
    startStream(): Promise<void>;
    /**
     * Starts background daemon with UDP discovery responder
     */
    startDaemon(sshPort?: number): Promise<void>;
    stop(): void;
}
//# sourceMappingURL=server.d.ts.map