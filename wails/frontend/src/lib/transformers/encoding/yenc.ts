// @ts-nocheck
// yenc encoding transform (Usenet binary encoding)
import { BaseTransformer } from '../BaseTransformer';

export const yenc = new BaseTransformer({
    name: 'YEnc',
    priority: 250,
    category: 'encoding',
    func: function(text: string): string {
        // YEnc encodes bytes by adding 42 (0x2A)
        const bytes = new TextEncoder().encode(text);
        const output = [];

        for (const byte of bytes) {
            output.push((byte + 42) % 256);
        }

        // Output as hex bytes for displayability
        return output.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    },
    reverse: function(text: string): string {
        const tokens = text.trim().split(/\s+/);
        const bytes = [];

        for (const token of tokens) {
            const encoded = parseInt(token, 16);
            if (isNaN(encoded)) continue;
            bytes.push((encoded - 42 + 256) % 256);
        }

        try {
            return new TextDecoder().decode(new Uint8Array(bytes));
        } catch (e) {
            return '';
        }
    },
    preview: function(text: string): string {
        if (!text) return '[yenc]';
        return this.func(text.slice(0, 5));
    },
    detector: function(text: string): boolean {
        if (!text || text.length < 4) return false;
        // Detect space-separated hex bytes
        const tokens = text.trim().split(/\s+/);
        if (tokens.length < 3) return false;
        return tokens.every(t => /^[0-9A-Fa-f]{2}$/.test(t));
    }
});
