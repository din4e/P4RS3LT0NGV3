// Standard Galactic Alphabet (Commander Keen / Minecraft Enchanting Table)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Minecraft Enchanting Table',
    priority: 100,
    category: 'fantasy',
    description: 'Standard Galactic Alphabet (Commander Keen / Minecraft enchanting table)',
    map: {
        'A': 'ᔑ', 'B': 'ʖ', 'C': 'ᓵ', 'D': '↸', 'E': 'ᒷ', 'F': '⎓', 'G': '⊣',
        'H': '⍑', 'I': '╎', 'J': '⋮', 'K': 'ꖌ', 'L': 'ꖎ', 'M': 'ᒲ', 'N': 'リ',
        'O': '𝙹', 'P': '!¡', 'Q': 'ᑑ', 'R': '∷', 'S': 'ᓭ', 'T': 'ℸ\u0323', 'U': '⚍',
        'V': '⍊', 'W': '∴', 'X': '\u0307/', 'Y': '||', 'Z': '⨅'
    },
    func: function(text) {
        return [...text].map(c => {
            const upperC = c.toUpperCase();
            return this.map[upperC] || c;
        }).join('');
    },
    reverse: function(text) {
        const revMap = new Map();
        for (const [letter, sgaChar] of Object.entries(this.map)) {
            if (sgaChar && sgaChar !== letter) {
                revMap.set(sgaChar, letter);
            }
        }
        let result = text;
        result = result.replace(/!¡/g, 'P');
        result = result.replace(/ℸ\u0323/g, 'T');
        result = result.replace(/\u0307\//g, 'X');
        result = result.replace(/\|\|/g, 'Y');
        let decoded = '';
        for (const ch of result) {
            decoded += revMap.has(ch) ? revMap.get(ch) : ch;
        }
        return decoded;
    },
    preview: function(text) {
        if (!text) return '[sga]';
        return this.func(text.slice(0, 8));
    },
    detector: function(text) {
        return /[ᔑʖᓵ↸ᒷ⎓⊣⍑╎⋮ꖌꖎᒲリ𝙹ᑑ∷ᓭ⚍⍊∴⨅]/.test(text);
    }
});
