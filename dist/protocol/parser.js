import { EventEmitter } from 'node:events';
import { PROTOCOL_VERSION } from './constants.js';
/**
 * Encodes a protocol message into a newline-delimited JSON string.
 */
export function encodeMessage(message) {
    const envelope = {
        version: message.version ?? PROTOCOL_VERSION,
        timestamp: message.timestamp ?? Date.now(),
        ...message,
    };
    return JSON.stringify(envelope) + '\n';
}
/**
 * Creates a protocol message object with defaults.
 */
export function createMessage(type, options = {}) {
    return {
        version: PROTOCOL_VERSION,
        type,
        timestamp: Date.now(),
        ...options,
    };
}
/**
 * Streaming parser that splits incoming byte streams on newlines
 * and parses JSON protocol messages.
 */
export class LineProtocolParser extends EventEmitter {
    buffer = '';
    /**
     * Feed raw incoming chunk (string or buffer).
     */
    feed(chunk) {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
        this.buffer += text;
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, newlineIndex).trim();
            this.buffer = this.buffer.slice(newlineIndex + 1);
            if (!line) {
                continue;
            }
            try {
                const parsed = JSON.parse(line);
                if (typeof parsed === 'object' && parsed !== null && parsed.version) {
                    this.emit('message', parsed);
                }
                else {
                    this.emit('invalid', line, new Error('Message missing required version field'));
                }
            }
            catch (err) {
                this.emit('invalid', line, err);
            }
        }
    }
    /**
     * Reset the internal buffer.
     */
    reset() {
        this.buffer = '';
    }
}
//# sourceMappingURL=parser.js.map