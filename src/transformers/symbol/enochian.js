// @generated from data/alphabets — do not edit by hand
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Enochian Alphabet',
    priority: 100,
    category: 'symbol',
    description: 'Enochian angelic script (Unicode approximations)',
    map: {
        'A': 'ᛂ',
        'B': 'ᛃ',
        'C': 'ᛄ',
        'D': 'ᛅ',
        'E': 'ᛆ',
        'F': 'ᛇ',
        'G': 'ᛈ',
        'H': 'ᛉ',
        'I': 'ᛊ',
        'J': 'ᛋ',
        'K': 'ᛌ',
        'L': 'ᛍ',
        'M': 'ᛎ',
        'N': 'ᛏ',
        'O': 'ᛐ',
        'P': 'ᛑ',
        'Q': 'ᛒ',
        'R': 'ᛓ',
        'S': 'ᛔ',
        'T': 'ᛕ',
        'U': 'ᛖ',
        'V': 'ᛗ',
        'W': 'ᛘ',
        'X': 'ᛙ',
        'Y': 'ᛚ',
        'Z': 'ᛛ'
    },
    func: function(text) {
        return [...text].map(c => this.map[c] || this.map[c.toUpperCase()] || c).join('');
    },
    preview: function(text) {
        if (!text) return '[enochian]';
        return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
    },
    detector: function(text) {
        return new RegExp('[ᛂᛃᛄᛅᛆᛇᛈᛉᛊᛋ]', 'u').test(text);
    }
});
