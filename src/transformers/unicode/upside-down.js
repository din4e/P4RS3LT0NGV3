// upside-down transform
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({

        name: 'Upside Down',
    priority: 85,
    map: {
            'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ',
            'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ',
            's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
            'A': '∀', 'B': 'B', 'C': 'Ɔ', 'D': 'D', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ', 'H': 'H', 'I': 'I',
            'J': 'ſ', 'K': 'K', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ', 'Q': 'Q', 'R': 'R',
            'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
            '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
            '8': '8', '9': '6', '.': '˙', ',': "'", '?': '¿', '!': '¡', '"': ',,', "'": ',',
            '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<',
            '&': '⅋', '_': '‾'
        },
        configurableOptions: [
            {
                id: 'mode',
                label: 'Orientation',
                type: 'select',
                default: 'rotate180',
                options: [
                    { value: 'rotate180', label: '180° rotation (flip + reverse)' },
                    { value: 'flipVertical', label: 'Vertical flip (flip only)' }
                ]
            }
        ],
        // Create reverse map for decoding
        reverseMap: function() {
            const revMap = {};
            for (const [key, value] of Object.entries(this.map)) {
                revMap[value] = key;
            }
            return revMap;
        },
        func: function(text, options) {
            options = options || {};
            const flipped = [...text].map(c => this.map[c] || c);
            if (options.mode === 'flipVertical') {
                return flipped.join('');
            }
            return flipped.reverse().join('');
        },
        preview: function(text, options) {
            if (!text) return '[upside down]';
            return this.func(text.slice(0, 8), options);
        },
        reverse: function(text, options) {
            options = options || {};
            const revMap = this.reverseMap();
            const restored = [...text].map(c => revMap[c] || c);
            if (options.mode === 'flipVertical') {
                return restored.join('');
            }
            return restored.reverse().join('');
        }

});