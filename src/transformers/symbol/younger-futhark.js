// Younger Futhark — 16-rune medieval alphabet (J→I, V→U; lossy Latin round-trip)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const MAP = {
        A: '\u16BC', B: '\u16D2', C: '\u16B9', D: '\u16CF', E: '\u16C1',
        F: '\u16A0', G: '\u16B9', H: '\u16BC', I: '\u16C1', J: '\u16C1',
        K: '\u16B9', L: '\u16D2', M: '\u16D2', N: '\u16BE', O: '\u16A2',
        P: '\u16D2', Q: '\u16B9', R: '\u16B1', S: '\u16C7', T: '\u16CF',
        U: '\u16A6', V: '\u16A0', W: '\u16A6', X: '\u16C7', Y: '\u16E6',
        Z: '\u16C7'
    };

    const REV = {
        '\u16A0': 'F', '\u16A2': 'O', '\u16A6': 'U', '\u16B1': 'R', '\u16B9': 'K',
        '\u16BC': 'H', '\u16BE': 'N', '\u16C1': 'I', '\u16C7': 'S', '\u16CF': 'T',
        '\u16D2': 'L', '\u16E6': 'Y'
    };

    return new BaseTransformer({
        name: 'Younger Futhark',
        priority: 100,
        category: 'symbol',
        description: 'Younger Futhark runes for Latin letters (16 runes; J→I, V→U; lossy reverse)',
        func: function(text) {
            return [...text.toUpperCase()].map(function(ch) {
                return MAP[ch] || ch;
            }).join('');
        },
        reverse: function(text) {
            return [...text].map(function(ch) {
                return REV[ch] || ch;
            }).join('');
        },
        preview: function(text) {
            if (!text) return '[younger-futhark]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
        },
        detector: function(text) {
            return /[\u16A0-\u16FF]/u.test(text);
        }
    });
})();
