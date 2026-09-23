// Keyword shift cipher (Caesar shift from keyword letters)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Keyword Shift Cipher',
    priority: 60,
    category: 'cipher',
    key: 'KEY',
    configurableOptions: [
        { id: 'key', label: 'Keyword', type: 'text', default: 'KEY' }
    ],
    _keyStr: function(options) {
        const k = options && options.key != null ? String(options.key) : null;
        return (k || this.key || 'KEY').toUpperCase().replace(/[^A-Z]/g, '');
    },
    _shiftChar: function(c, shift, decode) {
        const code = c.charCodeAt(0);
        const s = ((shift % 26) + 26) % 26;
        const delta = decode ? (26 - s) % 26 : s;
        if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + delta) % 26) + 65);
        if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + delta) % 26) + 97);
        return c;
    },
    func: function(text, options) {
        const key = this._keyStr(options);
        if (!key.length) return text;
        let out = '';
        let j = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (/[a-zA-Z]/.test(c)) {
                const shift = key[j % key.length].charCodeAt(0) - 65;
                out += this._shiftChar(c, shift, false);
                j++;
            } else out += c;
        }
        return out;
    },
    reverse: function(text, options) {
        const key = this._keyStr(options);
        if (!key.length) return text;
        let out = '';
        let j = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (/[a-zA-Z]/.test(c)) {
                const shift = key[j % key.length].charCodeAt(0) - 65;
                out += this._shiftChar(c, shift, true);
                j++;
            } else out += c;
        }
        return out;
    },
    preview: function(text, options) {
        if (!text) return '[keyword-shift]';
        return this.func(text.slice(0, 8), options) + '...';
    }
});
