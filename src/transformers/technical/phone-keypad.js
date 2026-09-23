// Phone keypad cipher (letters to dial digits, one press each)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const KEYPAD = {
        'A': '2', 'B': '2', 'C': '2',
        'D': '3', 'E': '3', 'F': '3',
        'G': '4', 'H': '4', 'I': '4',
        'J': '5', 'K': '5', 'L': '5',
        'M': '6', 'N': '6', 'O': '6',
        'P': '7', 'Q': '7', 'R': '7', 'S': '7',
        'T': '8', 'U': '8', 'V': '8',
        'W': '9', 'X': '9', 'Y': '9', 'Z': '9',
        '0': '0', '1': '1'
    };
    const REV = {};
    for (const [letter, digit] of Object.entries(KEYPAD)) {
        if (!REV[digit]) REV[digit] = letter;
    }

    return new BaseTransformer({
        name: 'Phone Keypad Cipher',
        priority: 70,
        category: 'technical',
        configurableOptions: [
            {
                id: 'spacing',
                label: 'Space between digits',
                type: 'boolean',
                default: true
            }
        ],
        func: function(text, options) {
            options = options || {};
            const digits = [...text.toUpperCase()].map(c => KEYPAD[c] || (/[0-9]/.test(c) ? c : '')).filter(Boolean);
            return options.spacing ? digits.join(' ') : digits.join('');
        },
        reverse: function(text) {
            const tokens = text.trim().split(/\s+/).join('').split('');
            return tokens.map(d => REV[d] || d).join('');
        },
        preview: function(text, options) {
            if (!text) return '[keypad]';
            return this.func(text.slice(0, 6), options) + '...';
        },
        detector: function(text) {
            const cleaned = text.replace(/\s/g, '');
            return cleaned.length >= 4 && /^[0-9]+$/.test(cleaned);
        }
    });
})();
