// @ts-nocheck
// elder-futhark transform
import { BaseTransformer } from '../BaseTransformer';

export const elderFuthark = new BaseTransformer({

        name: 'Elder Futhark',
    priority: 100,
    map: {
            'a': 'ᚨ', 'b': 'ᛒ', 'c': 'ᚳ', 'd': 'ᛞ', 'e': 'ᛖ', 'f': 'ᚠ', 'g': 'ᚷ', 'h': 'ᚺ', 'i': 'ᛁ',
            'j': 'ᛃ', 'k': 'ᚲ', 'l': 'ᛚ', 'm': 'ᛗ', 'n': 'ᚾ', 'o': 'ᛟ', 'p': 'ᛈ', 'q': 'ᚲᚹ', 'r': 'ᚱ',
            's': 'ᛋ', 't': 'ᛏ', 'u': 'ᚢ', 'v': 'ᚡ', 'w': 'ᚹ', 'x': 'ᚳᛋ', 'y': 'ᚤ', 'z': 'ᛉ'
        },
        // Create reverse map for decoding
        reverseMap: function() {
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value] = key;
            }
            return revMap;
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[runes]';
            return this.func(text.slice(0, 5));
        },
        reverse: function(text: string): string {
            const revMap = (this as any).reverseMap();
            return [...text].map(c => revMap[c] || c).join('');
        },
        // Detector: Check for Elder Futhark runes
        detector: function(text: string): boolean {
            // Elder Futhark runes (U+16A0-U+16F8)
            // Check for the unique runes used in this transform
            return /[ᚨᚳᚲᛟᚤᛒᛞᛖᚠᚷᚺᛁᛃᛚᛗᚾᛈᛩᚱᛋᛏᚢᚡᚹᛉ]/.test(text);
        }

});