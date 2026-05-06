// @ts-nocheck
// quenya transform
import { BaseTransformer } from '../BaseTransformer';

export const quenya = new BaseTransformer({

        name: 'Quenya (Tolkien Elvish)',
    priority: 100,
    map: {
            'a': 'a', 'b': 'v', 'c': 'k', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i',
            'j': 'y', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'kw', 'r': 'r',
            's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'ks', 'y': 'y', 'z': 'z',
            'A': 'A', 'B': 'V', 'C': 'K', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I',
            'J': 'Y', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'KW', 'R': 'R',
            'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'KS', 'Y': 'Y', 'Z': 'Z'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        reverse: function(text: string): string {
            // Create reverse map
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value] = key;
            }
            return [...text].map(c => revMap[c] || c).join('');
        },
        // Detector: Check for Quenya patterns
        detector: function(text: string): boolean {
            // Quenya has characteristic patterns like 'kw' and 'ks', but since the encoding is mostly
            // 1:1 (b->v, c->k, j->y, q->kw, x->ks), we look for multiple instances of these patterns
            const patterns = text.match(/kw|ks/gi);
            // If there are at least 1 multi-char pattern, it's likely Quenya
            return patterns && patterns.length >= 1;
        }

});