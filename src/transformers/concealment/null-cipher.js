// Null cipher — hide/extract letters at a fixed position in each word
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function syntheticWord(letter, position) {
        const L = letter.toLowerCase();
        const pads = ['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'n', 'l'];
        let word = '';
        const len = Math.max(position + 1, 3);
        for (let i = 0; i < len; i++) {
            if (i === position - 1) {
                word += L;
            } else {
                word += pads[i % pads.length];
            }
        }
        return word;
    }

    function pickCoverWord(letter, position, index, coverWords) {
        const target = letter.toLowerCase();
        const pos = position - 1;
        if (coverWords && coverWords.length) {
            for (let i = 0; i < coverWords.length; i++) {
                const word = coverWords[(index + i) % coverWords.length];
                const clean = word.replace(/[^a-zA-Z0-9]/g, '');
                if (clean[pos] && clean[pos].toLowerCase() === target) {
                    return word;
                }
            }
        }
        return syntheticWord(letter, position);
    }

    function normalizeSecret(text, includeSpecial) {
        if (includeSpecial) {
            return text.replace(/\s+/g, '');
        }
        return text.replace(/[^a-zA-Z0-9]/g, '');
    }

    function extractNull(text, options) {
        options = options || {};
        const scope = options.scope === 'text' ? 'text' : 'words';
        const includeSpecial = !!options.includeSpecial;
        const position = Math.max(1, Math.min(10, parseInt(options.position, 10) || 2));

        if (scope === 'text') {
            const source = includeSpecial ? text.replace(/\s/g, '') : text.replace(/[^a-zA-Z0-9]/g, '');
            let out = '';
            for (let i = position - 1; i < source.length; i += position) {
                out += source[i];
            }
            return out;
        }

        const pos = position - 1;
        if (includeSpecial) {
            const words = text.match(/\S+/g) || [];
            return words.map(function(word) {
                return word.charAt(pos) || '';
            }).join('');
        }

        const words = text.match(/[a-zA-Z0-9']+/g) || [];
        return words.map(function(word) {
            const clean = word.replace(/[^a-zA-Z0-9]/g, '');
            if (pos >= 0 && pos < clean.length) {
                return clean[pos];
            }
            return '';
        }).join('');
    }

    return new BaseTransformer({
        name: 'Null Cipher',
        priority: 45,
        category: 'concealment',
        description: 'Conceal a message in cover text by fixing one letter position in each word, or extract hidden letters.',
        configurableOptions: [
            {
                id: 'scope',
                label: 'Extraction scope',
                type: 'select',
                default: 'words',
                options: [
                    { value: 'words', label: 'Nth letter of each word' },
                    { value: 'text', label: 'Every Nth letter of full text' }
                ]
            },
            {
                id: 'position',
                label: 'Letter position / interval (1 = first letter or every letter)',
                type: 'number',
                default: 2,
                min: 1,
                max: 10,
                step: 1
            },
            {
                id: 'includeSpecial',
                label: 'Include special characters',
                type: 'boolean',
                default: false
            },
            {
                id: 'coverText',
                label: 'Cover word pool (optional, space-separated)',
                type: 'text',
                default: ''
            },
            {
                id: 'wordSeparator',
                label: 'Word separator',
                type: 'select',
                default: ' ',
                options: [
                    { value: ' ', label: 'Space' },
                    { value: '\n', label: 'New line' },
                    { value: ', ', label: 'Comma' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const position = Math.max(1, Math.min(10, parseInt(options.position, 10) || 2));
            const sep = options.wordSeparator != null ? String(options.wordSeparator) : ' ';
            const includeSpecial = !!options.includeSpecial;
            const secret = normalizeSecret(text, includeSpecial);
            if (!secret) {
                return text;
            }
            const coverWords = String(options.coverText || '')
                .match(/[a-zA-Z0-9']+/g) || [];
            const words = secret.split('').map(function(ch, index) {
                return pickCoverWord(ch, position, index, coverWords);
            });
            return words.join(sep);
        },
        reverse: function(text, options) {
            return extractNull(text, options || {});
        },
        preview: function(text, options) {
            if (!text) {
                return '[null-cipher]';
            }
            return this.func(text.slice(0, 8), options) + '...';
        },
        detector: function(text) {
            const words = text.match(/[a-zA-Z0-9']+/g) || [];
            return words.length >= 3 && words.length <= 500;
        }
    });
})();
