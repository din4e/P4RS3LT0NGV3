// Vernam cipher (one-time pad style additive mod 26 with key)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Vernam Cipher',
    priority: 60,
    category: 'cipher',
    key: 'SECRET',
    configurableOptions: [
        { id: 'key', label: 'Key (pad)', type: 'text', default: 'SECRET' }
    ],
    _keyStr: function(options) {
        const k = options && options.key != null ? String(options.key) : null;
        return (k || this.key || 'SECRET').toUpperCase().replace(/[^A-Z]/g, '');
    },
    _apply: function(text, options, decode) {
        const key = this._keyStr(options);
        if (!key.length) return text;
        let out = '';
        let j = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const code = c.charCodeAt(0);
            const k = key[j % key.length].charCodeAt(0) - 65;
            if (code >= 65 && code <= 90) {
                out += String.fromCharCode(decode
                    ? ((code - 65 + 26 - k) % 26) + 65
                    : ((code - 65 + k) % 26) + 65);
                j++;
            } else if (code >= 97 && code <= 122) {
                out += String.fromCharCode(decode
                    ? ((code - 97 + 26 - k) % 26) + 97
                    : ((code - 97 + k) % 26) + 97);
                j++;
            } else out += c;
        }
        return out;
    },
    func: function(text, options) {
        return this._apply(text, options, false);
    },
    reverse: function(text, options) {
        return this._apply(text, options, true);
    },
    preview: function(text, options) {
        if (!text) return '[vernam]';
        return this.func(text.slice(0, 8), options) + '...';
    }
});
