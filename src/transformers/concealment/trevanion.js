// Trevanion cipher — extract letters N positions after punctuation (steganography)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const DEFAULT_TRIGGERS = '.,!?;:\u2014';
    const DEFAULT_FILLER = 'the quick brown fox jumps over the lazy dog while a warm wind blew across the open field';

    function isTrigger(ch, triggers) {
        return triggers.includes(ch);
    }

    function extractLetter(text, start, offset, lettersOnly) {
        let count = 0;
        for (let i = start; i < text.length; i++) {
            const c = text[i];
            if (lettersOnly) {
                if (/[A-Za-z]/.test(c)) count++;
            } else if (!/\s/.test(c)) {
                count++;
            }
            if (count === offset) return c;
        }
        return '';
    }

    function postTriggerSnippet(letter, offset) {
        const pads = 'etaoinshrdlucmfwypvbgkqjxz';
        let out = '';
        for (let i = 1; i <= offset; i++) {
            if (i === offset) {
                out += letter;
            } else {
                out += pads[(letter.charCodeAt(0) + i * 3) % pads.length];
            }
        }
        return out;
    }

    function buildCover(secret, options) {
        const offset = Math.max(1, Number(options.offset) || 3);
        const triggers = options.triggers || DEFAULT_TRIGGERS;
        const trigger = triggers.charAt(0) || ',';
        const coverWords = String(options.fillerWords || DEFAULT_FILLER)
            .match(/[a-zA-Z']+/g) || DEFAULT_FILLER.split(/\s+/);
        let out = '';
        for (let si = 0; si < secret.length; si++) {
            if (si > 0) out += ' ';
            out += coverWords[si % coverWords.length];
            out += trigger;
            out += postTriggerSnippet(secret[si], offset);
        }
        return out.replace(/\s+/g, ' ').trim();
    }

    return new BaseTransformer({
        name: 'Trevanion Cipher',
        priority: 75,
        category: 'concealment',
        description: 'Hide letters N positions after punctuation marks, or extract them from cover text.',
        configurableOptions: [
            {
                id: 'offset',
                label: 'Letters after each mark (N)',
                type: 'number',
                default: 3,
                min: 1,
                max: 20
            },
            {
                id: 'lettersOnly',
                label: 'Count letters only (ignore spaces/punct)',
                type: 'boolean',
                default: true
            },
            {
                id: 'triggers',
                label: 'Trigger punctuation characters',
                type: 'text',
                default: '.,!?;:'
            },
            {
                id: 'mode',
                label: 'Encode mode',
                type: 'select',
                default: 'embed',
                options: [
                    { value: 'embed', label: 'Build cover text around secret' },
                    { value: 'decode', label: 'Extract only (input is cover text)' }
                ]
            },
            {
                id: 'fillerWords',
                label: 'Cover word pool (space-separated)',
                type: 'text',
                default: ''
            }
        ],
        func: function(text, options) {
            options = options || {};
            if (options.mode === 'decode') return text;
            const secret = text.replace(/\s/g, '');
            if (!secret) return text;
            return buildCover(secret, options);
        },
        reverse: function(text, options) {
            options = options || {};
            const offset = Number(options.offset) || 3;
            const triggers = options.triggers || DEFAULT_TRIGGERS;
            const lettersOnly = options.lettersOnly !== false;
            let out = '';
            for (let i = 0; i < text.length; i++) {
                if (isTrigger(text[i], triggers)) {
                    const ch = extractLetter(text, i + 1, offset, lettersOnly);
                    if (ch) out += ch;
                }
            }
            return out;
        },
        preview: function(text, options) {
            if (!text) return '[trevanion]';
            const dec = this.reverse(text, options);
            return dec ? dec.slice(0, 16) + '...' : this.func(text.slice(0, 8), options).slice(0, 24) + '...';
        },
        detector: function(text) {
            const triggers = DEFAULT_TRIGGERS;
            let hits = 0;
            for (let i = 0; i < text.length; i++) {
                if (isTrigger(text[i], triggers)) hits++;
            }
            return hits >= 3;
        }
    });
})();
