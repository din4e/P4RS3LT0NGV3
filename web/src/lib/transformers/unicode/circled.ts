// @ts-nocheck
// circled unicode transform
import { BaseTransformer } from '../BaseTransformer';

export const circled = new BaseTransformer({
    name: 'Circled',
    priority: 150,
    category: 'unicode',
    map: {
        'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ',
        'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ', 'J': 'Ⓙ',
        'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ',
        'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ', 'S': 'Ⓢ', 'T': 'Ⓣ',
        'U': 'Ⓤ', 'V': 'Ⓥ', 'W': 'Ⓦ', 'X': 'Ⓧ', 'Y': 'Ⓨ',
        'Z': 'Ⓩ',
        '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④',
        '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
    },
    func: function(text: string): string {
        let result = '';
        for (const char of text) {
            const upper = char.toUpperCase();
            if (this.map![upper]) {
                result += this.map![upper];
            } else if (this.map![char]) {
                result += this.map![char];
            } else {
                result += char;
            }
        }
        return result;
    },
    reverse: function(text: string): string {
        const reverseMap: Record<string, string> = {};
        for (const [key, value] of Object.entries(this.map!)) {
            reverseMap[value] = key;
        }
        
        let result = '';
        for (const char of text) {
            if (reverseMap[char]) {
                result += reverseMap[char];
            } else {
                result += char;
            }
        }
        return result;
    },
    preview: function(text: string): string {
        if (!text) return '[circled]';
        return this.func(text.slice(0, 5));
    },
    detector: function(text: string): boolean {
        const circledChars = Object.values(this.map);
        return circledChars.some(char => text.includes(char));
    }
});

