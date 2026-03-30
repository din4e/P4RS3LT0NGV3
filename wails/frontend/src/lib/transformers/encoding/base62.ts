// @ts-nocheck
// base62 transform
import { BaseTransformer } from '../BaseTransformer';

export const base62 = new BaseTransformer({

        name: 'Base62',
    priority: 290,
    alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        func: function(text: string): string {
            if (!text) return '';
            const bytes = new TextEncoder().encode(text);
            let n = 0n;
            for (let b of bytes) { n = (n << 8n) + BigInt(b); }
            if (n === 0n) return '0';
            let out = '';
            while (n > 0n) {
                const rem = n % 62n;
                n = n / 62n;
                out = this.alphabet[Number(rem)] + out;
            }
            return out;
        },
        preview: function(text: string): string {
            if (!text) return '[base62]';
            return this.func(text.slice(0, 3)) + '...';
        },
        reverse: function(text: string): string {
            if (!text) return '';
            let n = 0n;
            for (let c of text) {
                const i = this.alphabet.indexOf(c);
                if (i < 0) continue;
                n = n * 62n + BigInt(i);
            }
            const bytes = [];
            while (n > 0n) {
                bytes.unshift(Number(n % 256n));
                n = n / 256n;
            }
            if (bytes.length === 0) bytes.push(0);
            return new TextDecoder().decode(Uint8Array.from(bytes));
        }

});