// @ts-nocheck
// fraktur transform
import { BaseTransformer } from '../BaseTransformer';

export const fraktur = new BaseTransformer({

        name: 'Fraktur',
    priority: 85,
    func: function(text: string): string {
            const capMap = {
                'A': 0x1D504, 'B': 0x1D505, 'C': 0x212D, 'D': 0x1D507, 'E': 0x1D508, 'F': 0x1D509, 'G': 0x1D50A,
                'H': 0x210C, 'I': 0x2111, 'J': 0x1D50D, 'K': 0x1D50E, 'L': 0x1D50F, 'M': 0x1D510, 'N': 0x1D511,
                'O': 0x1D512, 'P': 0x1D513, 'Q': 0x1D514, 'R': 0x211C, 'S': 0x1D516, 'T': 0x1D517, 'U': 0x1D518,
                'V': 0x1D519, 'W': 0x1D51A, 'X': 0x1D51B, 'Y': 0x1D51C, 'Z': 0x2128
            };
            const lowerBase = 0x1D51E; // 'a'
            return [...text].map(c => {
                const code = c.charCodeAt(0);
                if (c >= 'A' && c <= 'Z') {
                    const fr = capMap[c];
                    return fr ? String.fromCodePoint(fr) : c;
                }
                if (c >= 'a' && c <= 'z') {
                    return String.fromCodePoint(lowerBase + (code - 97));
                }
                return c;
            }).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[fraktur]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '...' : '');
        },
        reverse: function(text: string): string {
            const capMap = {
                0x1D504:'A',0x1D505:'B',0x212D:'C',0x1D507:'D',0x1D508:'E',0x1D509:'F',0x1D50A:'G',
                0x210C:'H',0x2111:'I',0x1D50D:'J',0x1D50E:'K',0x1D50F:'L',0x1D510:'M',0x1D511:'N',
                0x1D512:'O',0x1D513:'P',0x1D514:'Q',0x211C:'R',0x1D516:'S',0x1D517:'T',0x1D518:'U',
                0x1D519:'V',0x1D51A:'W',0x1D51B:'X',0x1D51C:'Y',0x2128:'Z'
            };
            const lowerBase = 0x1D51E;
            return Array.from(text).map(ch => {
                const cp = ch.codePointAt(0);
                if (cp in capMap) return capMap[cp];
                if (cp >= lowerBase && cp < lowerBase + 26) return String.fromCharCode(97 + (cp - lowerBase));
                return ch;
            }).join('');
        }

});