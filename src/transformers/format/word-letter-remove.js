// Remove a letter at a fixed index from each word
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function removeAt(word, index) {
        if (!word) return word;
        let i = index;
        if (i < 0) i = word.length + i;
        if (i < 0 || i >= word.length) return word;
        return word.slice(0, i) + word.slice(i + 1);
    }

    return new BaseTransformer({
        name: 'Word Letter Remove',
        priority: 60,
        category: 'format',
        configurableOptions: [
            {
                id: 'index',
                label: 'Character index to remove (0 = first, -1 = last)',
                type: 'number',
                default: -1,
                min: -20,
                max: 20
            }
        ],
        func: function(text, options) {
            options = options || {};
            const index = Number.isFinite(Number(options.index)) ? Number(options.index) : -1;
            return text.replace(/\S+/g, w => removeAt(w, index));
        },
        reverse: function(text, options) {
            options = options || {};
            const index = Number.isFinite(Number(options.index)) ? Number(options.index) : -1;
            const placeholder = '\u0001';
            return text.replace(/\S+/g, w => {
                if (index === 0 || index <= -w.length) return placeholder + w;
                if (index === -1 || index === w.length - 1) return w + placeholder;
                const i = index < 0 ? w.length + index : index;
                return w.slice(0, i) + placeholder + w.slice(i);
            }).replace(/\u0001/g, '?');
        },
        preview: function(text, options) {
            if (!text) return '[-letter]';
            return this.func(text.slice(0, 24), options);
        },
        canDecode: false
    });
})();
