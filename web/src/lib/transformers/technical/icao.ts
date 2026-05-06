// @ts-nocheck
// ICAO spelling alphabet transform
import { BaseTransformer } from '../BaseTransformer';

export const icao = new BaseTransformer({
    name: 'ICAO Spelling Alphabet',
    priority: 200,
    category: 'technical',
    alphabet: {
        'A': 'ALFA', 'B': 'BRAVO', 'C': 'CHARLIE', 'D': 'DELTA', 'E': 'ECHO',
        'F': 'FOXTROT', 'G': 'GOLF', 'H': 'HOTEL', 'I': 'INDIA', 'J': 'JULIETT',
        'K': 'KILO', 'L': 'LIMA', 'M': 'MIKE', 'N': 'NOVEMBER', 'O': 'OSCAR',
        'P': 'PAPA', 'Q': 'QUEBEC', 'R': 'ROMEO', 'S': 'SIERRA', 'T': 'TANGO',
        'U': 'UNIFORM', 'V': 'VICTOR', 'W': 'WHISKEY', 'X': 'XRAY', 'Y': 'YANKEE',
        'Z': 'ZULU'
    },
    func: function(text: string): string {
        const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '');
        if (cleaned.length === 0) return text;
        
        let result = '';
        for (const char of cleaned) {
            if (this.alphabet[char]) {
                result += this.alphabet[char] + ' ';
            } else {
                result += char + ' ';
            }
        }
        return result.trim();
    },
    reverse: function(text: string): string {
        // Create reverse map
        const reverseMap: Record<string, string> = {};
        for (const [letter, word] of Object.entries(this.alphabet)) {
            reverseMap[word.toUpperCase()] = letter;
        }
        
        // Split by spaces and convert back
        const words = text.toUpperCase().split(/\s+/);
        let result = '';
        for (const word of words) {
            if (reverseMap[word]) {
                result += reverseMap[word];
            } else if (word.length === 1 && /[A-Z]/.test(word)) {
                result += word;
            }
        }
        return result;
    },
    preview: function(text: string): string {
        if (!text) return '[icao]';
        return this.func(text.slice(0, 3));
    },
    detector: function(text: string): boolean {
        // Check for ICAO words
        const icaoWords = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIETT', 'KILO', 'LIMA', 'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY', 'XRAY', 'YANKEE', 'ZULU'];
        const upper = text.toUpperCase();
        const matches = icaoWords.filter(word => upper.includes(word));
        return matches.length >= 2;
    }
});

