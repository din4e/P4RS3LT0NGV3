// Homoglyph substitution — visually confusable Unicode characters
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const TO = {
        'A': '\u0410', 'B': '\u0412', 'C': '\u0421', 'E': '\u0415', 'H': '\u041D',
        'I': '\u0406', 'J': '\u0408', 'K': '\u041A', 'M': '\u041C', 'N': '\u041D',
        'O': '\u041E', 'P': '\u0420', 'S': '\u0405', 'T': '\u0422', 'X': '\u0425',
        'Y': '\u0423', 'a': '\u0430', 'c': '\u0441', 'e': '\u0435', 'i': '\u0456',
        'j': '\u0458', 'o': '\u043E', 'p': '\u0440', 's': '\u0455', 'x': '\u0445',
        'y': '\u0443'
    };
    const REV = {};
    for (const [k, v] of Object.entries(TO)) REV[v] = k;

    return new BaseTransformer({
        name: 'Homoglyph Generator',
        priority: 70,
        category: 'unicode',
        func: function(text) {
            return [...text].map(c => TO[c] || c).join('');
        },
        reverse: function(text) {
            return [...text].map(c => REV[c] || c).join('');
        },
        preview: function(text) {
            if (!text) return '[homoglyph]';
            return this.func(text.slice(0, 12));
        },
        detector: function(text) {
            return /[\u0400-\u04FF]/.test(text) && /[A-Za-z]/.test(text) === false;
        }
    });
})();
