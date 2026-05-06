// @ts-nocheck
// chemical transform
import { BaseTransformer } from '../BaseTransformer';

export const chemical = new BaseTransformer({

        name: 'Chemical Symbols',
    priority: 70,
    map: {
            'a': 'Ac', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'Es', 'f': 'F', 'g': 'Ge', 'h': 'H', 'i': 'I',
            'j': 'J', 'k': 'K', 'l': 'L', 'm': 'Mn', 'n': 'N', 'o': 'O', 'p': 'P', 'q': 'Q', 'r': 'R',
            's': 'S', 't': 'Ti', 'u': 'U', 'v': 'V', 'w': 'W', 'x': 'Xe', 'y': 'Y', 'z': 'Zn',
            'A': 'AC', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'ES', 'F': 'F', 'G': 'GE', 'H': 'H', 'I': 'I',
            'J': 'J', 'K': 'K', 'L': 'L', 'M': 'MN', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R',
            'S': 'S', 'T': 'TI', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'XE', 'Y': 'Y', 'Z': 'ZN'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        reverse: function(text: string): string {
            // Build reverse map using only lowercase keys (since func() lowercases before encoding)
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                // Only use lowercase letter mappings for reverse
                if (key >= 'a' && key <= 'z') {
                    revMap[value] = key;
                }
            }
            
            // Parse the text, trying 2-character symbols first, then 1-character
            let result = '';
            let i = 0;
            while (i < text.length) {
                // Try 2-character symbol first
                if (i + 1 < text.length) {
                    const twoChar = text.substring(i, i + 2);
                    if (revMap[twoChar]) {
                        result += revMap[twoChar];
                        i += 2;
                        continue;
                    }
                }
                
                // Try 1-character symbol
                const oneChar = text[i];
                if (revMap[oneChar]) {
                    result += revMap[oneChar];
                } else {
                    result += oneChar; // Keep non-mapped characters
                }
                i++;
            }
            return result;
        },
        // Detector: Check for chemical element symbols pattern
        detector: function(text: string): boolean {
            const cleaned = text.trim();
            if (cleaned.length < 3) return false;
            
            // Extract only the letter sequences (ignoring spaces, punctuation, emojis, etc.)
            const letterParts = cleaned.match(/[A-Za-z]+/g);
            if (!letterParts || letterParts.length === 0) return false;
            
            // Check if the letters follow chemical symbol patterns
            const chemicalPattern = /^(Ac|B|C|D|Es|F|Ge|H|I|J|K|L|Mn|N|O|P|Q|R|S|Ti|U|V|W|Xe|Y|Zn|AC|ES|GE|MN|TI|XE|ZN)+$/;
            
            // At least 70% of letter parts should match the chemical pattern
            const matchingParts = letterParts.filter(part => chemicalPattern.test(part));
            return matchingParts.length >= letterParts.length * 0.7;
        }

});