// Acéré cipher — French solfège (A = Ré) with optional note-duration variants
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const SOLFEGE = ['Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
    const SOLFEGE_ASCII = ['re', 'mi', 'fa', 'sol', 'la', 'si', 'do'];
    const EIGHTH = '♪';
    const HALF = '●';
    const WHOLE = '𝅝';
    const QUARTER = '♩';

    /** Eighth then half; whole notes used for digits / extended tiers */
    const BLOCK_DURATIONS = {
        'full-alphabet': [EIGHTH, HALF, WHOLE, QUARTER],
        'eighth-then-half': [EIGHTH, HALF, WHOLE, QUARTER],
        'half-then-eighth': [HALF, EIGHTH, QUARTER, WHOLE],
        'first-half-eighth': null,
        'solfège-only': null,
        'an-septet': null
    };

    function solfegeToPitch(token) {
        const key = token.toLowerCase().replace(/é/g, 'e');
        return SOLFEGE_ASCII.indexOf(key);
    }

    function durationForLetterIndex(index, durationMode) {
        if (durationMode === 'solfège-only') return '';
        if (durationMode === 'first-half-eighth') {
            return index < 13 ? EIGHTH : HALF;
        }
        if (durationMode === 'an-septet') {
            return index < 7 ? EIGHTH : HALF;
        }
        const block = Math.floor(index / 7);
        const table = BLOCK_DURATIONS[durationMode] || BLOCK_DURATIONS['full-alphabet'];
        return table[block] || QUARTER;
    }

    function durationForDigit(digit, durationMode) {
        if (durationMode === 'solfège-only') return '';
        return WHOLE;
    }

    function encodeLetter(ch, options) {
        const upper = ch.toUpperCase();
        if (/[A-Z]/.test(upper)) {
            const index = upper.charCodeAt(0) - 65;
            const duration = durationForLetterIndex(index, options.durationMode);
            return duration + SOLFEGE[index % 7];
        }
        if (options.includeDigits && /[0-9]/.test(ch)) {
            const digit = parseInt(ch, 10);
            return durationForDigit(digit, options.durationMode) + SOLFEGE[digit % 7];
        }
        return ch;
    }

    function matchingLetterIndices(pitch, duration, durationMode) {
        const out = [];
        for (let i = 0; i < 26; i++) {
            if (i % 7 !== pitch) continue;
            if (durationMode === 'solfège-only') {
                out.push(i);
                continue;
            }
            const expected = durationForLetterIndex(i, durationMode);
            if (!duration || duration === expected) out.push(i);
        }
        return out;
    }

    function parseToken(raw) {
        const chars = [...raw.trim()];
        if (!chars.length) return { duration: '', namePart: '' };
        const first = chars[0];
        if (first === EIGHTH || first === HALF || first === WHOLE || first === QUARTER) {
            return { duration: first, namePart: chars.slice(1).join('') };
        }
        return { duration: '', namePart: raw.trim() };
    }

    function decodeToken(raw, options) {
        const t = raw.trim();
        if (!t) return '';

        const { duration, namePart } = parseToken(t);

        const pitch = solfegeToPitch(namePart);
        if (pitch < 0) return t;

        if (duration === WHOLE && options.includeDigits && !/[A-Za-z]/.test(t)) {
            for (let d = 0; d <= 9; d++) {
                if (d % 7 === pitch) return String(d);
            }
        }

        const candidates = matchingLetterIndices(pitch, duration, options.durationMode);
        if (candidates.length === 0) return t;
        return String.fromCharCode(65 + candidates[0]);
    }

    function splitTokens(text, separator) {
        if (separator === 'none') {
            return text.match(/[♪●𝅝♩]?(?:Ré|Re|Mi|Fa|Sol|La|Si|Do)/gi) || [];
        }
        if (separator === 'comma') {
            return text.split(/\s*,\s*/).filter(Boolean);
        }
        return text.trim().split(/\s+/).filter(Boolean);
    }

    return new BaseTransformer({
        name: 'Acéré Cipher',
        priority: 88,
        category: 'music',
        configurableOptions: [
            {
                id: 'durationMode',
                label: 'Note duration variant',
                type: 'select',
                default: 'full-alphabet',
                options: [
                    {
                        value: 'full-alphabet',
                        label: '♪ / ● / 𝅝 / ♩ by septet (full A–Z, reversible)'
                    },
                    {
                        value: 'an-septet',
                        label: '♪ A–G, ● H–N (A–N only)'
                    },
                    {
                        value: 'eighth-then-half',
                        label: '♪ / ● / 𝅝 / ♩ septets (same as full)'
                    },
                    {
                        value: 'half-then-eighth',
                        label: 'Inverted septet durations'
                    },
                    {
                        value: 'first-half-eighth',
                        label: '♪ A–M, ● N–Z (lossy)'
                    },
                    {
                        value: 'solfège-only',
                        label: 'Solfège names only (lossy)'
                    }
                ]
            },
            {
                id: 'includeDigits',
                label: 'Encode digits 0–9 (0 = Ré, 𝅝 whole note)',
                type: 'boolean',
                default: false
            },
            {
                id: 'lettersOnly',
                label: 'Letters (and digits) only on encode',
                type: 'boolean',
                default: true
            },
            {
                id: 'separator',
                label: 'Separator between notes',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'comma', label: 'Comma' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const durationMode = options.durationMode || 'full-alphabet';
            const opts = {
                durationMode,
                includeDigits: !!options.includeDigits
            };
            const sep = options.separator === 'comma' ? ', '
                : (options.separator === 'none' ? '' : ' ');
            const chars = options.lettersOnly !== false
                ? [...text].filter(c => /[A-Za-z0-9]/.test(c) && (opts.includeDigits || /[A-Za-z]/.test(c)))
                : [...text];
            const parts = chars.map(c => encodeLetter(c, opts));
            return options.separator === 'none' ? parts.join('') : parts.join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const opts = {
                durationMode: options.durationMode || 'full-alphabet',
                includeDigits: !!options.includeDigits
            };
            const tokens = splitTokens(text, options.separator || 'space');
            return tokens.map(t => decodeToken(t, opts)).join('');
        },
        preview: function(text, options) {
            if (!text) return '[acéré]';
            return this.func(text.slice(0, 8), options) + '...';
        },
        detector: function(text) {
            const solfegeHits = (text.match(/\b(ré|re|mi|fa|sol|la|si|do)\b/gi) || []).length;
            const symbolPairs = (text.match(/[♪●𝅝♩](?:Ré|Re|Mi|Fa|Sol|La|Si|Do)/g) || []).length;
            return solfegeHits >= 2 || symbolPairs >= 2;
        }
    });
})();
