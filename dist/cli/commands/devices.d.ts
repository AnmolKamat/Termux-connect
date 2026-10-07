export declare function listDevicesCommand(options?: {
    json?: boolean;
}): Promise<void>;
export declare function discoverDevicesCommand(options?: {
    json?: boolean;
    timeout?: number;
}): Promise<void>;
export declare function pairDeviceCommand(host: string, options?: {
    port?: number;
    name?: string;
}): Promise<void>;
export declare function removeDeviceCommand(id: string): Promise<void>;
//# sourceMappingURL=devices.d.ts.map