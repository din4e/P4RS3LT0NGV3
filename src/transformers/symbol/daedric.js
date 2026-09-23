// @generated from data/alphabets — do not edit by hand
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Daedric Alphabet',
    priority: 100,
    category: 'symbol',
    description: 'Elder Scrolls inspired Daedric-style symbols',
    map: {
        'A': 'ᚠ',
        'B': 'ᚡ',
        'C': 'ᚢ',
        'D': 'ᚣ',
        'E': 'ᚤ',
        'F': 'ᚥ',
        'G': 'ᚦ',
        'H': 'ᚧ',
        'I': 'ᚨ',
        'J': 'ᚩ',
        'K': 'ᚪ',
        'L': 'ᚫ',
        'M': 'ᚬ',
        'N': 'ᚭ',
        'O': 'ᚮ',
        'P': 'ᚯ',
        'Q': 'ᚰ',
        'R': 'ᚱ',
        'S': 'ᚲ',
        'T': 'ᚳ',
        'U': 'ᚴ',
        'V': 'ᚵ',
        'W': 'ᚶ',
        'X': 'ᚷ',
        'Y': 'ᚸ',
        'Z': 'ᚹ'
    },
    func: function(text) {
        return [...text].map(c => this.map[c] || this.map[c.toUpperCase()] || c).join('');
    },
    preview: function(text) {
        if (!text) return '[daedric]';
        return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
    },
    detector: function(text) {
        return new RegExp('[ᚠᚡᚢᚣᚤᚥᚦᚧᚨᚩ]', 'u').test(text);
    }
});
