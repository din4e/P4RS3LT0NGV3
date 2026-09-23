// Trithemius cipher (progressive Caesar / tabula recta rows)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Trithemius Cipher',
    priority: 60,
    category: 'cipher',
    configurableOptions: [
        { id: 'startShift', label: 'Starting shift', type: 'number', default: 0, min: 0, max: 25, step: 1 },
        { id: 'step', label: 'Shift increment per letter', type: 'number', default: 1, min: 1, max: 25, step: 1 }
    ],
    _opts: function(options) {
        options = options || {};
        return {
            start: Number(options.startShift != null ? options.startShift : 0) || 0,
            step: Number(options.step != null ? options.step : 1) || 1
        };
    },
    _transform: function(text, options, decode) {
        const { start, step } = this._opts(options);
        let out = '';
        let letterIdx = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const code = c.charCodeAt(0);
            const shift = (start + letterIdx * step) % 26;
            const delta = decode ? (26 - shift) % 26 : shift;
            if (code >= 65 && code <= 90) {
                out += String.fromCharCode(((code - 65 + delta) % 26) + 65);
                letterIdx++;
            } else if (code >= 97 && code <= 122) {
                out += String.fromCharCode(((code - 97 + delta) % 26) + 97);
                letterIdx++;
            } else out += c;
        }
        return out;
    },
    func: function(text, options) {
        return this._transform(text, options, false);
    },
    reverse: function(text, options) {
        return this._transform(text, options, true);
    },
    preview: function(text, options) {
        if (!text) return '[trithemius]';
        return this.func(text.slice(0, 8), options) + '...';
    }
});
