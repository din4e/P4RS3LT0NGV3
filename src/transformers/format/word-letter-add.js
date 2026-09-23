// Insert a letter into each word at a fixed position
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function mutateWord(word, insertChar, position) {
        if (!word || !insertChar) return word;
        const ch = insertChar.charAt(0);
        if (position === 'start' || position === 'prefix') return ch + word;
        if (position === 'end' || position === 'suffix') return word + ch;
        const idx = parseInt(position, 10);
        if (Number.isFinite(idx) && idx >= 0 && idx <= word.length) {
            return word.slice(0, idx) + ch + word.slice(idx);
        }
        return word + ch;
    }

    return new BaseTransformer({
        name: 'Word Letter Add',
        priority: 60,
        category: 'format',
        configurableOptions: [
            {
                id: 'insertChar',
                label: 'Letter to insert',
                type: 'text',
                default: 'x'
            },
            {
                id: 'position',
                label: 'Position in each word',
                type: 'select',
                default: 'end',
                options: [
                    { value: 'start', label: 'Start (prefix)' },
                    { value: 'end', label: 'End (suffix)' },
                    { value: '1', label: 'After 1st character' },
                    { value: '2', label: 'After 2nd character' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const insertChar = (options.insertChar || 'x').charAt(0);
            const position = options.position || 'end';
            return text.replace(/\S+/g, w => mutateWord(w, insertChar, position));
        },
        reverse: function(text, options) {
            options = options || {};
            const insertChar = (options.insertChar || 'x').charAt(0);
            const position = options.position || 'end';
            const esc = insertChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (position === 'start' || position === 'prefix') {
                return text.replace(new RegExp('^' + esc + '(\\S+)|(\\s|^)' + esc + '(\\S+)', 'g'), '$1$2$3');
            }
            if (position === 'end' || position === 'suffix') {
                return text.replace(new RegExp('(\\S+)' + esc + '(?=\\s|$)', 'g'), '$1');
            }
            const idx = parseInt(position, 10);
            if (Number.isFinite(idx)) {
                return text.replace(new RegExp('(\\S{' + idx + '})' + esc + '(\\S*)', 'g'), '$1$2');
            }
            return text.replace(new RegExp(esc + '$'), '');
        },
        preview: function(text, options) {
            if (!text) return '[+letter]';
            return this.func(text.slice(0, 24), options);
        },
        detector: function(text) {
            return false;
        }
    });
})();
