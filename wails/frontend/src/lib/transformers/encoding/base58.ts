// @ts-nocheck
// base58 transform
import { BaseTransformer } from '../BaseTransformer';

export const base58 = new BaseTransformer({
    name: 'Base58',
    priority: 275,
    // Detector: Only Base58 characters (excludes 0, O, I, l)
    detector: function(text: string): boolean {
        const cleaned = text.trim().replace(/\s/g, '');
        return cleaned.length >= 4 && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(cleaned);
    },
    
    alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
        func: function(text: string): string {
            if (!text) return '';
            const bytes = new TextEncoder().encode(text);
            // Count leading zeros
            let zeros = 0;
            for (let b of bytes) { if (b === 0) zeros++; else break; }
            // Convert to BigInt
            let n = 0n;
            for (let b of bytes) { n = (n << 8n) + BigInt(b); }
            // Encode
            let out = '';
            while (n > 0n) {
                const rem = n % 58n;
                n = n / 58n;
                out = this.alphabet[Number(rem)] + out;
            }
            // Add leading zeros as '1'
            for (let i = 0; i < zeros; i++) out = '1' + out;
            return out || '1';
        },
        preview: function(text: string): string {
            if (!text) return '[base58]';
            const full = this.func(text);
            return full.substring(0, 12) + (full.length > 12 ? '...' : '');
        },
        reverse: function(text: string): string {
            if (!text) return '';
            // Count leading '1's
            let zeros = 0;
            for (let c of text) { if (c === '1') zeros++; else break; }
            // Convert to BigInt
            let n = 0n;
            for (let c of text) {
                const i = this.alphabet.indexOf(c);
                if (i < 0) continue;
                n = n * 58n + BigInt(i);
            }
            // Convert BigInt to bytes
            const bytes = [];
            while (n > 0n) {
                bytes.unshift(Number(n % 256n));
                n = n / 256n;
            }
            for (let i = 0; i < zeros; i++) bytes.unshift(0);
            return new TextDecoder().decode(Uint8Array.from(bytes));
        }

});