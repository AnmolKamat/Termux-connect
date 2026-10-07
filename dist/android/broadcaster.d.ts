export declare class AndroidBroadcaster {
    private socket;
    private pairingServer;
    private beaconTimer;
    private mdnsProc;
    private isRunning;
    private port;
    constructor(sshPort?: number);
    private getLocalIp;
    private getUserName;
    start(): Promise<void>;
    private startPairingHttpServer;
    private startMdns;
    stop(): void;
}
//# sourceMappingURL=broadcaster.d.ts.map