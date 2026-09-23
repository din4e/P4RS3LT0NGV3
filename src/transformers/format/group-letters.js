// Split text into fixed-size letter groups
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Group Letters',
    priority: 50,
    category: 'format',
    description: 'Split letters into fixed-size groups or rejoin grouped text.',
    configurableOptions: [
        {
            id: 'groupSize',
            label: 'Letters per group',
            type: 'number',
            default: 5,
            min: 1,
            max: 32,
            step: 1
        },
        {
            id: 'separator',
            label: 'Group separator',
            type: 'select',
            default: ' ',
            options: [
                { value: ' ', label: 'Space' },
                { value: '-', label: 'Dash' },
                { value: '.', label: 'Dot' },
                { value: '\n', label: 'New line' }
            ]
        },
        {
            id: 'lettersOnly',
            label: 'Letters only (ignore spaces/punctuation)',
            type: 'boolean',
            default: true
        }
    ],
    func: function(text, options) {
        options = options || {};
        const size = Math.max(1, Math.min(32, parseInt(options.groupSize, 10) || 5));
        const sep = options.separator != null ? String(options.separator) : ' ';
        const lettersOnly = options.lettersOnly !== false;
        const source = lettersOnly ? text.replace(/[^a-zA-Z]/g, '') : text.replace(/\s+/g, '');
        if (!source) {
            return text;
        }
        const groups = [];
        for (let i = 0; i < source.length; i += size) {
            groups.push(source.slice(i, i + size));
        }
        return groups.join(sep);
    },
    reverse: function(text, options) {
        options = options || {};
        const sep = options.separator != null ? String(options.separator) : ' ';
        if (sep === ' ') {
            return text.replace(/\s+/g, '');
        }
        const esc = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.split(new RegExp(esc.length ? esc : '\\s+')).join('');
    },
    preview: function(text, options) {
        if (!text) {
            return '[group-letters]';
        }
        return this.func(text.slice(0, 20), options);
    },
    detector: function(text) {
        return /\b[a-zA-Z]{1,8}(?:[ \-.][a-zA-Z]{1,8}){2,}\b/.test(text);
    }
});
