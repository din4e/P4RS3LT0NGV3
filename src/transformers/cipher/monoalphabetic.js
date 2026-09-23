// Monoalphabetic substitution cipher (custom 26-letter alphabet)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const PLAIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return new BaseTransformer({
        name: 'Monoalphabetic Substitution',
        priority: 60,
        category: 'cipher',
        configurableOptions: [
            {
                id: 'keyword',
                label: 'Keyword (builds cipher alphabet when set)',
                type: 'text',
                default: ''
            },
            {
                id: 'alphabet',
                label: 'Cipher alphabet (26 unique letters A-Z)',
                type: 'text',
                default: 'QWERTYUIOPASDFGHJKLZXCVBNM'
            }
        ],
        _keywordAlpha: function(keyword) {
            const kw = String(keyword || '').toUpperCase().replace(/[^A-Z]/g, '');
            const seen = new Set();
            let alpha = '';
            for (let i = 0; i < kw.length; i++) {
                const c = kw[i];
                if (!seen.has(c)) {
                    seen.add(c);
                    alpha += c;
                }
            }
            for (let i = 0; i < PLAIN.length; i++) {
                const c = PLAIN[i];
                if (!seen.has(c)) {
                    seen.add(c);
                    alpha += c;
                }
            }
            return alpha.slice(0, 26);
        },
        _cipherAlpha: function(options) {
            const keyword = String(options && options.keyword != null ? options.keyword : '').trim();
            if (keyword) {
                return this._keywordAlpha(keyword);
            }
            const raw = String(options && options.alphabet != null ? options.alphabet : 'QWERTYUIOPASDFGHJKLZXCVBNM')
                .toUpperCase()
                .replace(/[^A-Z]/g, '');
            const seen = new Set();
            let alpha = '';
            for (const c of raw) {
                if (!seen.has(c)) {
                    seen.add(c);
                    alpha += c;
                }
            }
            for (const c of PLAIN) {
                if (!seen.has(c)) {
                    seen.add(c);
                    alpha += c;
                }
            }
            return alpha.slice(0, 26);
        },
        _maps: function(options) {
            const cipher = this._cipherAlpha(options);
            const enc = {};
            const dec = {};
            for (let i = 0; i < 26; i++) {
                enc[PLAIN[i]] = cipher[i];
                enc[PLAIN[i].toLowerCase()] = cipher[i].toLowerCase();
                dec[cipher[i]] = PLAIN[i];
                dec[cipher[i].toLowerCase()] = PLAIN[i].toLowerCase();
            }
            return { enc, dec };
        },
        func: function(text, options) {
            const { enc } = this._maps(options || {});
            return [...text].map(c => enc[c] || c).join('');
        },
        reverse: function(text, options) {
            const { dec } = this._maps(options || {});
            return [...text].map(c => dec[c] || c).join('');
        },
        preview: function(text, options) {
            if (!text) return '[mono]';
            return this.func(text.slice(0, 8), options) + '...';
        }
    });
})();
