import { EventEmitter } from 'node:events';
import type { ProtocolMessage as IProtocolMessage } from './types.js';
/**
 * Encodes a protocol message into a newline-delimited JSON string.
 */
export declare function encodeMessage<T>(message: Omit<IProtocolMessage<T>, 'version'> & {
    version?: number;
}): string;
/**
 * Creates a protocol message object with defaults.
 */
export declare function createMessage<T>(type: IProtocolMessage['type'], options?: Partial<Omit<IProtocolMessage<T>, 'type' | 'version'>>): IProtocolMessage<T>;
/**
 * Streaming parser that splits incoming byte streams on newlines
 * and parses JSON protocol messages.
 */
export declare class LineProtocolParser extends EventEmitter {
    private buffer;
    /**
     * Feed raw incoming chunk (string or buffer).
     */
    feed(chunk: string | Buffer): void;
    /**
     * Reset the internal buffer.
     */
    reset(): void;
}
//# sourceMappingURL=parser.d.ts.map