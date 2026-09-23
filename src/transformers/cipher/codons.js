// Genetic codons — letters encoded as DNA triplets (RNA codon table, simplified)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const MAP = {
        'A': 'GCT', 'B': 'TGT', 'C': 'TGT', 'D': 'GAT', 'E': 'GAA', 'F': 'TTT',
        'G': 'GGT', 'H': 'CAT', 'I': 'ATT', 'J': 'TAT', 'K': 'AAA', 'L': 'TTA',
        'M': 'ATG', 'N': 'AAT', 'O': 'TAT', 'P': 'CCT', 'Q': 'CAA', 'R': 'CGT',
        'S': 'TCT', 'T': 'ACT', 'U': 'TGT', 'V': 'GTT', 'W': 'TGG', 'X': 'TAG',
        'Y': 'TAT', 'Z': 'TGT'
    };
    const REV = {};
    for (const [k, v] of Object.entries(MAP)) {
        if (!REV[v]) REV[v] = k;
    }

    return new BaseTransformer({
        name: 'Codons (Genetic Code)',
        priority: 84,
        category: 'encoding',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between codons',
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
            return [...text.toUpperCase()].filter(c => /[A-Z]/.test(c)).map(c => MAP[c] || c).join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const tokens = options.separator === 'none'
                ? text.match(/[ACGT]{3}/gi) || []
                : text.trim().split(/\s+/);
            return tokens.map(t => REV[t.toUpperCase()] || '').join('');
        },
        preview: function(text, options) {
            if (!text) return '[codon]';
            return this.func(text.slice(0, 6), options);
        },
        detector: function(text) {
            const tokens = text.trim().split(/\s+/);
            return tokens.length >= 2 && tokens.every(t => /^[ACGT]{3}$/i.test(t));
        }
    });
})();
