// Acrostic — read or build messages from initial letters
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const TEMPLATES = [
        '{letter}idden words carry meaning beyond the surface.',
        '{letter}ach line begins with the secret letter.',
        '{letter}ften the first letter tells the story.',
        '{letter}essages can hide in plain sight.',
        '{letter}eaders who look closely will find clues.'
    ];

    function extractAcrostic(text, mode, includeSpecial) {
        if (mode === 'words') {
            if (includeSpecial) {
                const words = text.match(/\S+/g) || [];
                return words.map(function(word) {
                    return word.charAt(0) || '';
                }).join('');
            }
            const words = text.match(/[a-zA-Z0-9']+/g) || [];
            return words.map(function(word) {
                return word.replace(/[^a-zA-Z0-9]/g, '')[0] || '';
            }).join('');
        }
        return text.split(/\r?\n/).map(function(line) {
            const trimmed = line.trim();
            if (!trimmed) {
                return '';
            }
            if (includeSpecial) {
                return trimmed.charAt(0);
            }
            const match = trimmed.match(/[a-zA-Z0-9]/);
            return match ? match[0] : '';
        }).join('');
    }

    function normalizeSecret(text, includeSpecial) {
        if (includeSpecial) {
            return text.replace(/\s+/g, '');
        }
        return text.replace(/[^a-zA-Z0-9]/g, '');
    }

    function formatAcrosticLine(letter, template) {
        const line = template.replace(/\{letter\}/g, letter);
        if (/[a-zA-Z]/.test(letter)) {
            return line.charAt(0).toUpperCase() + line.slice(1);
        }
        return line;
    }

    return new BaseTransformer({
        name: 'Acrostic',
        priority: 46,
        category: 'concealment',
        description: 'Extract hidden messages from the first letter of each line or word, or build acrostic cover text.',
        configurableOptions: [
            {
                id: 'mode',
                label: 'Read letters from',
                type: 'select',
                default: 'lines',
                options: [
                    { value: 'lines', label: 'First letter of each line' },
                    { value: 'words', label: 'First letter of each word' }
                ]
            },
            {
                id: 'includeSpecial',
                label: 'Include special characters',
                type: 'boolean',
                default: false
            },
            {
                id: 'lineTemplate',
                label: 'Custom line template ({letter} placeholder)',
                type: 'text',
                default: ''
            }
        ],
        func: function(text, options) {
            options = options || {};
            const mode = options.mode === 'words' ? 'words' : 'lines';
            const includeSpecial = !!options.includeSpecial;
            const customTemplate = String(options.lineTemplate || '').trim();
            const secret = normalizeSecret(text, includeSpecial);
            if (!secret) {
                return text;
            }
            if (mode === 'words') {
                return secret.split('').join(' ');
            }
            return secret.split('').map(function(letter, index) {
                const template = customTemplate || TEMPLATES[index % TEMPLATES.length];
                return formatAcrosticLine(letter, template);
            }).join('\n');
        },
        reverse: function(text, options) {
            options = options || {};
            const mode = options.mode === 'words' ? 'words' : 'lines';
            const includeSpecial = !!options.includeSpecial;
            return extractAcrostic(text, mode, includeSpecial);
        },
        preview: function(text, options) {
            if (!text) {
                return '[acrostic]';
            }
            return this.func(text.slice(0, 5), options);
        },
        detector: function(text) {
            if (/\n/.test(text)) {
                const lines = text.split(/\r?\n/).filter(function(line) {
                    return line.trim().length > 0;
                });
                return lines.length >= 2;
            }
            return (text.match(/[a-zA-Z0-9']+/g) || []).length >= 3;
        }
    });
})();
