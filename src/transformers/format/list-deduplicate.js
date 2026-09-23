// Remove duplicate lines from a list
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'List Deduplicate',
    priority: 50,
    category: 'format',
    canDecode: false,
    description: 'Remove duplicate lines while preserving first occurrence order.',
    configurableOptions: [
        {
            id: 'ignoreCase',
            label: 'Ignore case when comparing',
            type: 'boolean',
            default: false
        },
        {
            id: 'trimLines',
            label: 'Trim whitespace on each line',
            type: 'boolean',
            default: true
        }
    ],
    func: function(text, options) {
        options = options || {};
        const ignoreCase = !!options.ignoreCase;
        const trimLines = options.trimLines !== false;
        const lines = text.split(/\r?\n/);
        const seen = {};
        const out = [];

        lines.forEach(function(line) {
            let value = trimLines ? line.trim() : line;
            const key = ignoreCase ? value.toLowerCase() : value;
            if (seen[key]) {
                return;
            }
            seen[key] = true;
            out.push(value);
        });

        return out.join('\n');
    },
    preview: function(text, options) {
        if (!text) {
            return '[dedupe]';
        }
        return this.func(text, options).split('\n').slice(0, 3).join('\n') + '...';
    }
});
