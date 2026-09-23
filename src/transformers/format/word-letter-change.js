// Replace a letter at a fixed index in each word
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function changeAt(word, index, replacement) {
        if (!word || !replacement) return word;
        let i = index;
        if (i < 0) i = word.length + i;
        if (i < 0 || i >= word.length) return word;
        return word.slice(0, i) + replacement.charAt(0) + word.slice(i + 1);
    }

    return new BaseTransformer({
        name: 'Word Letter Change',
        priority: 60,
        category: 'format',
        configurableOptions: [
            {
                id: 'index',
                label: 'Character index to replace',
                type: 'number',
                default: 0,
                min: -20,
                max: 20
            },
            {
                id: 'replaceChar',
                label: 'Replacement letter',
                type: 'text',
                default: 'x'
            }
        ],
        func: function(text, options) {
            options = options || {};
            const index = Number.isFinite(Number(options.index)) ? Number(options.index) : 0;
            const rep = (options.replaceChar || 'x').charAt(0);
            return text.replace(/\S+/g, w => changeAt(w, index, rep));
        },
        reverse: function(text, options) {
            options = options || {};
            const index = Number.isFinite(Number(options.index)) ? Number(options.index) : 0;
            const rep = (options.replaceChar || 'x').charAt(0);
            const esc = rep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(/\S+/g, w => {
                let i = index;
                if (i < 0) i = w.length + i;
                if (i < 0 || i >= w.length) return w;
                const re = new RegExp('^(.{' + i + '})' + esc + '(.*)$');
                const m = w.match(re);
                return m ? m[1] + '?' + m[2] : w;
            });
        },
        preview: function(text, options) {
            if (!text) return '[~letter]';
            return this.func(text.slice(0, 24), options);
        },
        canDecode: false
    });
})();
