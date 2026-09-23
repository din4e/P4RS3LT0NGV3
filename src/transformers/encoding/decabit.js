// Decabit code (10-pulse ripple control encoding, ASCII 0-126)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    // Patterns use + (positive pulse) and - (negative pulse); index = code value
    const PATTERNS = [
        '--+-+++-+-', '+--+++--+-', '+--++-+-+-', '+--+-++-+-', '----+++-++',
        '++--+++---', '++--++--+-', '++--+-+-+-', '++---++-+-', '---++++-+-',
        '+-+-+++---', '+-+-+-+-+-', '+-+--++-+-', '+---++-++-', '+---++--++',
        '--+++-++--', '---++-+++-', '+---+-++-+', '+--++--+-+', '+--++-+--+',
        '+-+++--+--', '+--+++-+--', '++--+-++--', '-+-++-++--', '+--++--++-',
        '+-+++-+---', '++-+--++--', '+-+-+-++--', '+--+-+++--', '+--+--++-+',
        '+-++-++---', '+-++-+-+--', '+-+-++-+--', '+---++++--', '+-+--+-++-',
        '+++--++---', '+++--+-+--', '+++---++--', '++---+++--', '--+-++++--',
        '++--++-+--', '-+-+-+-++-', '++----+++-', '+----+-+++', '++---+-+-+',
        '++-+-+-+--', '++-+-+--+-', '+++----++-', '++--+--++-', '+--+-+-++-',
        '++++----+-', '++-++---+-', '+-+++---+-', '-++++---+-', '+-+-+---++',
        '+++-++----', '+++-+-+---', '+-+-+--++-', '-++-+--++-', '+++-+----',
        '-+++-++---', '-+-+-++-+-', '++---++--+', '++-+--+--+', '++-+++----',
        '++++--+---', '+--++++---', '-+-++++---', '++-+--+-+-', '-++---+++-',
        '+---+-+++-', '--+-+-+++-', '+----++++-', '--+--++++-', '+++---+-+-',
        '+-++---++-', '+--+--+++-', '--++--+++-', '-+-+---+-++', '-+++--+-+-',
        '-+-++-+-+-', '-+++---++-', '-+-++--++-', '-+---++++-', '-++++--+--',
        '-++-++-+--', '--++++-+--', '--++-+++--', '--++-+-++-', '-++++----',
        '--++++--+-', '--++-++-+-', '+-++----++', '-+-+++--+-', '-++-+-+-+-',
        '-+--++-++-', '---+++-++-', '-+--+-+++-', '+---+++-+-', '-+--+++-+-',
        '+-+-++--+-', '+--++-++--', '++-++--+--', '+-++--++--', '+-+--+++--',
        '-++--+++--', '++---+-++-', '++-+---++-', '+++-+---+-', '+++-+--+--',
        '++-+-++---', '++-++-+---', '+-+---+++-', '+-++--+-+-', '-+-+--+++-',
        '-+++-+-+--', '+-++-+--+-', '-++-+++---', '+++--+--+-', '+++++-----',
        '-+++++----', '--+++++---', '---+++++--', '----+++++-', '++++++++++'
    ];
    const TO_CODE = {};
    const TO_CHAR = {};
    for (let i = 0; i < PATTERNS.length; i++) {
        TO_CODE[i] = PATTERNS[i];
        TO_CHAR[PATTERNS[i]] = String.fromCharCode(i);
    }

    function normalizePattern(raw) {
        return raw.replace(/[+]/g, '+').replace(/[-−–—]/g, '-').replace(/\s/g, '');
    }

    return new BaseTransformer({
        name: 'Decabit Code',
        priority: 90,
        category: 'electronics',
        configurableOptions: [
            {
                id: 'groupSeparator',
                label: 'Separator between pulse groups',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'newline', label: 'New line' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.groupSeparator === 'newline' ? '\n'
                : (options.groupSeparator === 'none' ? '' : ' ');
            return [...text].map(c => TO_CODE[c.charCodeAt(0)] || TO_CODE[63]).join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const splitRe = options.groupSeparator === 'newline' ? /\n+/
                : (options.groupSeparator === 'none' ? /(?=[+-]{10})/ : /\s+/);
            const groups = text.trim().split(splitRe).filter(Boolean);
            return groups.map(g => {
                const pat = normalizePattern(g);
                return TO_CHAR[pat] || '';
            }).join('');
        },
        preview: function(text, options) {
            if (!text) return '[decabit]';
            return this.func(text.slice(0, 3), options) + '...';
        },
        detector: function(text) {
            const groups = text.trim().split(/\s+/);
            return groups.length >= 2 && groups.every(g => /^[+-]{10}$/.test(normalizePattern(g)));
        }
    });
})();
