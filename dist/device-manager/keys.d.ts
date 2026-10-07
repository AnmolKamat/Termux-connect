export declare class KeyManager {
    /**
     * Ensures an Ed25519 keypair exists in the ~/.android-sync directory.
     */
    static ensureKeyPair(): Promise<{
        privateKeyPath: string;
        publicKeyPath: string;
        publicKeyContent: string;
    }>;
    /**
     * Fetches remote host public key and computes its SHA256 fingerprint.
     */
    static scanHostFingerprint(host: string, port?: number): Promise<{
        rawKey: string;
        fingerprint: string;
    }>;
    /**
     * Adds the scanned host key to ~/.android-sync/known_hosts.
     */
    static recordKnownHost(rawKeyLine: string): void;
}
//# sourceMappingURL=keys.d.ts.map