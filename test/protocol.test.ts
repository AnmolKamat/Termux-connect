import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { encodeMessage, LineProtocolParser, createMessage } from '../dist/protocol/parser.js';
import type { ProtocolMessage, NotificationPayload } from '../dist/protocol/types.js';

describe('Protocol Layer', () => {
  it('encodes message with newline delimiter and version', () => {
    const msg = encodeMessage({
      type: 'event',
      capability: 'notifications',
      event: 'notification.created',
      payload: { test: 123 },
    });

    assert.ok(msg.endsWith('\n'));
    const parsed = JSON.parse(msg.trim());
    assert.strictEqual(parsed.version, 1);
    assert.strictEqual(parsed.type, 'event');
    assert.strictEqual(parsed.capability, 'notifications');
    assert.strictEqual(parsed.payload.test, 123);
  });

  it('parses incoming chunks across packet boundaries', () => {
    const parser = new LineProtocolParser();
    const received: ProtocolMessage[] = [];

    parser.on('message', (m) => received.push(m));

    const msg1 = JSON.stringify({ version: 1, type: 'ping' });
    const msg2 = JSON.stringify({
      version: 1,
      type: 'event',
      capability: 'notifications',
      event: 'notification.created',
      payload: { title: 'Test' },
    });

    // Feed chunk in split fragments
    const combined = `${msg1}\n${msg2}\n`;
    const half = Math.floor(combined.length / 2);

    parser.feed(combined.slice(0, half));
    assert.strictEqual(received.length, 1); // first message parsed

    parser.feed(combined.slice(half));
    assert.strictEqual(received.length, 2); // second message parsed

    assert.strictEqual(received[0].type, 'ping');
    assert.strictEqual(received[1].type, 'event');
  });

  it('creates default envelope message', () => {
    const msg = createMessage('request', {
      capability: 'device',
      action: 'get_info',
    });
    assert.strictEqual(msg.version, 1);
    assert.strictEqual(msg.type, 'request');
    assert.strictEqual(msg.capability, 'device');
    assert.ok(typeof msg.timestamp === 'number');
  });
});
