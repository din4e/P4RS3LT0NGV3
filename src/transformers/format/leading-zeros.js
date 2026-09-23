// Pad or strip leading zeros on numeric tokens
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Leading Zeros',
    priority: 50,
    category: 'format',
    description: 'Pad numbers with leading zeros or strip them from numeric tokens.',
    configurableOptions: [
        {
            id: 'mode',
            label: 'Mode',
            type: 'select',
            default: 'pad',
            options: [
                { value: 'pad', label: 'Pad to width' },
                { value: 'strip', label: 'Strip leading zeros' }
            ]
        },
        {
            id: 'width',
            label: 'Pad width',
            type: 'number',
            default: 4,
            min: 1,
            max: 32,
            step: 1
        }
    ],
    func: function(text, options) {
        options = options || {};
        const mode = options.mode === 'strip' ? 'strip' : 'pad';
        const width = Math.max(1, Math.min(32, parseInt(options.width, 10) || 4));

        return text.replace(/\d+/g, function(num) {
            if (mode === 'strip') {
                const stripped = num.replace(/^0+(?=\d)/, '');
                return stripped === '' ? '0' : stripped;
            }
            return num.length >= width ? num : num.padStart(width, '0');
        });
    },
    reverse: function(text, options) {
        options = options || {};
        const mode = options.mode === 'strip' ? 'strip' : 'pad';
        if (mode === 'pad') {
            return text.replace(/\d+/g, function(num) {
                const stripped = num.replace(/^0+(?=\d)/, '');
                return stripped === '' ? '0' : stripped;
            });
        }
        const width = Math.max(1, Math.min(32, parseInt(options.width, 10) || 4));
        return text.replace(/\d+/g, function(num) {
            return num.length >= width ? num : num.padStart(width, '0');
        });
    },
    preview: function(text, options) {
        if (!text) {
            return '[leading-zeros]';
        }
        return this.func(text.slice(0, 40), options);
    },
    detector: function(text) {
        return /\b0+\d+\b/.test(text) || /\b\d{1,3}\b/.test(text);
    }
});
