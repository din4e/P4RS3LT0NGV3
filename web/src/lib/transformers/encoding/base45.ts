// @ts-nocheck
// base45 transform
import { BaseTransformer } from '../BaseTransformer';

export const base45 = new BaseTransformer({

        name: 'Base45',
    priority: 290,
    alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',
        func: function(text: string): string {
            const bytes = new TextEncoder().encode(text);
            const chars = [];
            for (let i=0;i<bytes.length;i+=2) {
                if (i+1 < bytes.length) {
                    const x = 256*bytes[i] + bytes[i+1];
                    const e = x % 45; const d = Math.floor(x/45) % 45; const c = Math.floor(x/45/45);
                    chars.push(this.alphabet[e], this.alphabet[d], this.alphabet[c]);
                } else {
                    const x = bytes[i];
                    const e = x % 45; const d = Math.floor(x/45);
                    chars.push(this.alphabet[e], this.alphabet[d]);
                }
            }
            return chars.join('');
        },
        preview: function(text: string): string {
            if (!text) return 'QED8W';
            return this.func(text.slice(0,3));
        },
        reverse: function(text: string): string {
            const index = {}; for (let i=0;i<this.alphabet.length;i++) index[this.alphabet[i]] = i;
            const codes = [...text].map(c => index[c]).filter(v => v !== undefined);
            const out = [];
            for (let i=0;i<codes.length;i+=3) {
                if (i+2 < codes.length) {
                    const x = codes[i] + codes[i+1]*45 + codes[i+2]*45*45;
                    out.push(x >> 8, x & 0xFF);
                } else if (i+1 < codes.length) {
                    const x = codes[i] + codes[i+1]*45;
                    out.push(x & 0xFF);
                }
            }
            return new TextDecoder().decode(Uint8Array.from(out));
        }

});