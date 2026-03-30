// @ts-nocheck
// maritime signal flags transform
import { BaseTransformer } from '../BaseTransformer';

export const maritimeFlags = new BaseTransformer({
    name: 'Maritime Signal Flags',
    priority: 200,
    category: 'technical',
    // International maritime signal flags (NATO phonetic with flag emojis)
    flags: {
        'A': '🚩', 'B': '🚩', 'C': '🚩', 'D': '🚩', 'E': '🚩',
        'F': '🚩', 'G': '🚩', 'H': '🚩', 'I': '🚩', 'J': '🚩',
        'K': '🚩', 'L': '🚩', 'M': '🚩', 'N': '🚩', 'O': '🚩',
        'P': '🚩', 'Q': '🚩', 'R': '🚩', 'S': '🚩', 'T': '🚩',
        'U': '🚩', 'V': '🚩', 'W': '🚩', 'X': '🚩', 'Y': '🚩',
        'Z': '🚩'
    },
    // Using flag emojis - actual maritime flags would need proper Unicode
    // For now, using regional indicator symbols which represent flags
    flagMap: {
        'A': '🇦', 'B': '🇧', 'C': '🇨', 'D': '🇩', 'E': '🇪',
        'F': '🇫', 'G': '🇬', 'H': '🇭', 'I': '🇮', 'J': '🇯',
        'K': '🇰', 'L': '🇱', 'M': '🇲', 'N': '🇳', 'O': '🇴',
        'P': '🇵', 'Q': '🇶', 'R': '🇷', 'S': '🇸', 'T': '🇹',
        'U': '🇺', 'V': '🇻', 'W': '🇼', 'X': '🇽', 'Y': '🇾',
        'Z': '🇿'
    },
    func: function(text: string): string {
        const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '');
        if (cleaned.length === 0) return text;
        
        let result = '';
        for (const char of cleaned) {
            if (this.flagMap[char]) {
                result += this.flagMap[char] + ' ';
            } else {
                result += char + ' ';
            }
        }
        return result.trim();
    },
    reverse: function(text: string): string {
        // Reverse map from flag emoji to letter
        const reverseMap: Record<string, string> = {};
        for (const [letter, flag] of Object.entries(this.flagMap)) {
            reverseMap[flag] = letter;
        }
        
        let result = '';
        // Match flag emojis (regional indicators - match each one individually)
        const flagChars = Object.values(this.flagMap);
        for (let i = 0; i < text.length; i++) {
            // Check for 2-char regional indicator sequences
            if (i + 1 < text.length) {
                const pair = text.substring(i, i + 2);
                if (reverseMap[pair]) {
                    result += reverseMap[pair];
                    i++; // Skip next char
                    continue;
                }
            }
            // Check single char
            const char = text[i];
            if (reverseMap[char]) {
                result += reverseMap[char];
            } else if (/[A-Z]/.test(char)) {
                result += char;
            }
        }
        
        return result;
    },
    preview: function(text: string): string {
        if (!text) return '[maritime-flags]';
        return this.func(text.slice(0, 3));
    },
    detector: function(text: string): boolean {
        // Check for regional indicator flag emojis (check for any flag in the map)
        const flagChars = Object.values(this.flagMap);
        return flagChars.some(flag => text.includes(flag));
    }
});

