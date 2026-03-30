// @ts-nocheck
// braille transform
import { BaseTransformer } from '../BaseTransformer';

export const braille = new BaseTransformer({
    name: 'Braille',
    priority: 300,
    // Detector: Must contain Braille characters (allows other chars too since braille doesn't encode everything)
    detector: function(text: string): boolean {
        const cleaned = text.trim();
        // Must contain at least 2 braille characters
        const brailleCount = (cleaned.match(/[⠀-⣿]/g) || []).length;
        return brailleCount >= 2;
    },
    
    map: {
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊',
            'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗',
            's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
            '0': '⠼⠚', '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
            '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        reverse: function(text: string): string {
            // Build reverse map
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value] = key;
            }
            
            // Decode character by character
            // Handle multi-character sequences (numbers use ⠼ prefix)
            let result = '';
            let i = 0;
            while (i < text.length) {
                // Check for number indicator (⠼)
                if (text[i] === '⠼' && i + 1 < text.length) {
                    const twoChar = text[i] + text[i + 1];
                    if (revMap[twoChar]) {
                        result += revMap[twoChar];
                        i += 2;
                        continue;
                    }
                }
                
                // Single character lookup
                const char = text[i];
                result += revMap[char] || char;
                i++;
            }
            
            return result;
        }

});