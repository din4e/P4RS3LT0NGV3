// @ts-nocheck
// ogham transform
import { BaseTransformer } from '../BaseTransformer';

export const ogham = new BaseTransformer({

        name: 'Ogham (Celtic)',
    priority: 70,
    map: {
            'a': 'ᚐ', 'b': 'ᚁ', 'c': 'ᚉ', 'd': 'ᚇ', 'e': 'ᚓ', 'f': 'ᚃ', 'g': 'ᚌ', 'h': 'ᚆ', 'i': 'ᚔ',
            'j': 'ᚈ', 'k': 'ᚊ', 'l': 'ᚂ', 'm': 'ᚋ', 'n': 'ᚅ', 'o': 'ᚑ', 'p': 'ᚚ', 'q': 'ᚊ', 'r': 'ᚏ',
            's': 'ᚄ', 't': 'ᚈ', 'u': 'ᚒ', 'v': 'ᚃ', 'w': 'ᚃ', 'x': 'ᚊ', 'y': 'ᚔ', 'z': 'ᚎ',
            'A': 'ᚐ', 'B': 'ᚁ', 'C': 'ᚉ', 'D': 'ᚇ', 'E': 'ᚓ', 'F': 'ᚃ', 'G': 'ᚌ', 'H': 'ᚆ', 'I': 'ᚔ',
            'J': 'ᚈ', 'K': 'ᚊ', 'L': 'ᚂ', 'M': 'ᚋ', 'N': 'ᚅ', 'O': 'ᚑ', 'P': 'ᚚ', 'Q': 'ᚊ', 'R': 'ᚏ',
            'S': 'ᚄ', 'T': 'ᚈ', 'U': 'ᚒ', 'V': 'ᚃ', 'W': 'ᚃ', 'X': 'ᚊ', 'Y': 'ᚔ', 'Z': 'ᚎ'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        reverse: function(text: string): string {
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value] = key;
            }
            return [...text].map(c => revMap[c] || c).join('');
        },
        // Detector: Check for Ogham characters
        detector: function(text: string): boolean {
            // Ogham alphabet (U+1680-U+169C)
            return /[ᚐᚁᚉᚇᚓᚃᚌᚆᚔᚈᚊᚂᚋᚅᚑᚚᚏᚄᚒᚎ]/.test(text);
        }

});