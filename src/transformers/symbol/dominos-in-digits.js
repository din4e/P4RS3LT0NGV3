// Dominos in digits — map 0-9 to domino tile notation
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    // Unicode domino tiles U+1F019 (🀙) = 0-0, through 6-6 grid; use simplified [a|b] for 0-9
    const MAP = {
        '0': '[0|0]', '1': '[0|1]', '2': '[1|1]', '3': '[1|2]', '4': '[2|2]',
        '5': '[2|3]', '6': '[3|3]', '7': '[3|4]', '8': '[4|4]', '9': '[4|5]'
    };
    const REV = {};
    for (const [d, v] of Object.entries(MAP)) REV[v] = d;

    return new BaseTransformer({
        name: 'Dominos in Digits',
        priority: 78,
        category: 'cipher',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between dominoes',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.separator === 'none' ? '' : ' ';
            const digits = text.replace(/\D/g, '');
            if (!digits) return text;
            return [...digits].map(d => MAP[d] || d).join(sep);
        },
        reverse: function(text) {
            const tokens = text.match(/\[\d\|\d\]/g) || [];
            if (!tokens.length) return text;
            return tokens.map(t => REV[t] || '').join('');
        },
        preview: function(text, options) {
            if (!text) return '[domino]';
            const digits = text.replace(/\D/g, '').slice(0, 5);
            return digits ? this.func(digits, options) : '[digits only]';
        },
        detector: function(text) {
            return (text.match(/\[\d\|\d\]/g) || []).length >= 2;
        }
    });
})();
