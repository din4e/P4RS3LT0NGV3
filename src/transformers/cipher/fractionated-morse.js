// Fractionated Morse cipher (Morse pairs mapped via Polybius-style square)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const MORSE = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..'
    };
    const REV_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    const SQUARE = [
        ['A', 'B', 'C', 'D', 'E'],
        ['F', 'G', 'H', 'I', 'K'],
        ['L', 'M', 'N', 'O', 'P'],
        ['Q', 'R', 'S', 'T', 'U'],
        ['V', 'W', 'X', 'Y', 'Z']
    ];
    const SYM = ['.', '-'];

    function morseStream(text) {
        return text.toUpperCase().replace(/[^A-Z]/g, '').split('')
            .map(c => MORSE[c] || '')
            .join('');
    }

    function streamToText(stream) {
        const chars = [];
        let buf = '';
        for (const s of stream) {
            if (s === '.' || s === '-') buf += s;
            else if (buf) {
                chars.push(buf);
                buf = '';
            }
        }
        if (buf) chars.push(buf);
        let out = '';
        for (const code of chars) out += REV_MORSE[code] || '';
        return out;
    }

    function pairToChar(a, b) {
        const row = SYM.indexOf(a);
        const col = SYM.indexOf(b);
        if (row < 0 || col < 0) return '';
        return SQUARE[row][col];
    }

    function charToPair(ch) {
        const c = ch === 'J' ? 'I' : ch;
        for (let r = 0; r < 5; r++) {
            for (let col = 0; col < 5; col++) {
                if (SQUARE[r][col] === c) return SYM[r] + SYM[col];
            }
        }
        return '';
    }

    return new BaseTransformer({
        name: 'Fractionated Morse',
        priority: 65,
        category: 'technical',
        configurableOptions: [
            {
                id: 'letterSeparator',
                label: 'Separator between letters',
                type: 'text',
                default: ''
            },
            {
                id: 'wordSeparator',
                label: 'Separator between words',
                type: 'select',
                default: ' ',
                options: [
                    { value: ' ', label: 'Space' },
                    { value: ' / ', label: 'Slash (Morse style)' },
                    { value: ' | ', label: 'Pipe' },
                    { value: '', label: 'None' }
                ]
            }
        ],
        _opts: function(options) {
            options = options || {};
            return {
                letterSeparator: options.letterSeparator != null ? String(options.letterSeparator) : '',
                wordSeparator: options.wordSeparator != null ? String(options.wordSeparator) : ' '
            };
        },
        func: function(text, options) {
            const { letterSeparator, wordSeparator } = this._opts(options);
            const words = text.toUpperCase().match(/[A-Z]+/g) || [];
            if (!words.length) {
                return text;
            }
            return words.map(function(word) {
                const stream = morseStream(word);
                let out = '';
                for (let i = 0; i < stream.length; i += 2) {
                    if (i + 1 < stream.length) {
                        if (out && letterSeparator) {
                            out += letterSeparator;
                        }
                        out += pairToChar(stream[i], stream[i + 1]);
                    }
                }
                return out;
            }).join(wordSeparator);
        },
        reverse: function(text, options) {
            const { letterSeparator, wordSeparator } = this._opts(options);
            let chunks = [text];
            if (wordSeparator) {
                chunks = text.split(wordSeparator);
            }
            return chunks.map(function(chunk) {
                const cleaned = letterSeparator
                    ? chunk.split(letterSeparator).join('')
                    : chunk;
                let pairs = '';
                for (const ch of cleaned.toUpperCase().replace(/[^A-Z]/g, '')) {
                    pairs += charToPair(ch);
                }
                return streamToText(pairs);
            }).join(' ');
        },
        preview: function(text, options) {
            if (!text) return '[frac-morse]';
            return this.func(text.slice(0, 6), options) + '...';
        }
    });
})();
