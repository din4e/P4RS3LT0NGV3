// @ts-nocheck
// hieroglyphics transform
import { BaseTransformer } from '../BaseTransformer';

export const hieroglyphics = new BaseTransformer({

        name: 'Hieroglyphics',
    priority: 70,
    map: {
            'a': '𓃭', 'b': '𓃮', 'c': '𓃯', 'd': '𓃰', 'e': '𓃱', 'f': '𓃲', 'g': '𓃳', 'h': '𓃴', 'i': '𓃵',
            'j': '𓃶', 'k': '𓃷', 'l': '𓃸', 'm': '𓃹', 'n': '𓃺', 'o': '𓃻', 'p': '𓃼', 'q': '𓃽', 'r': '𓃾',
            's': '𓃿', 't': '𓄀', 'u': '𓄁', 'v': '𓄂', 'w': '𓄃', 'x': '𓄄', 'y': '𓄅', 'z': '𓄆',
            'A': '𓄇', 'B': '𓄈', 'C': '𓄉', 'D': '𓄊', 'E': '𓄋', 'F': '𓄌', 'G': '𓄍', 'H': '𓄎', 'I': '𓄏',
            'J': '𓄐', 'K': '𓄑', 'L': '𓄒', 'M': '𓄓', 'N': '𓄔', 'O': '𓄕', 'P': '𓄖', 'Q': '𓄗', 'R': '𓄘',
            'S': '𓄙', 'T': '𓄚', 'U': '𓄛', 'V': '𓄜', 'W': '𓄝', 'X': '𓄞', 'Y': '𓄟', 'Z': '𓄠'
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
        // Detector: Check for Egyptian hieroglyphic characters
        detector: function(text: string): boolean {
            // Egyptian hieroglyphs - check for presence of any hieroglyphic character
            return /[\u{13000}-\u{1342F}]/u.test(text);
        }

});