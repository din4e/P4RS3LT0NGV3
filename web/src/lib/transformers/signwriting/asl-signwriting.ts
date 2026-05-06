// @ts-nocheck
// ASL SignWriting transform
import { BaseTransformer } from '../BaseTransformer';

export const aslSignwriting = new BaseTransformer({
    name: 'ASL SignWriting',
    priority: 0,
    canDecode: false,
    category: 'signwriting',
    description: 'American Sign Language fingerspelling in SignWriting (ISWA 2010). Horizontal or vertical layout.',
    configurableOptions: [
        {
            id: 'layout',
            label: 'Layout',
            type: 'select',
            default: 'horizontal',
            options: [
                { label: 'Horizontal', value: 'horizontal' },
                { label: 'Vertical', value: 'vertical' }
            ]
        }
    ],

    THIN: ' ',
    NBSP: ' ',

    aslMap: {
        'A': '\u{1D8F7}\u{1DA9C}', 'B': '\u{1D907}\u{1DA9C}', 'C': '\u{1D92D}\u{1DA9C}', 'D': '\u{1D801}\u{1DA9C}', 'E': '\u{1D90A}\u{1DA9C}',
        'F': '\u{1D8CE}\u{1DA9C}', 'G': '\u{1D8F0}', 'H': '\u{1D815}\u{1DAA2}', 'I': '\u{1D892}\u{1DA9C}',
        'J': '\u{1D8A2}\u{1DAAE}\n\u{1D892}\u{1DA9C}', 'K': '\u{1D900}\u{1DA9C}', 'L': '\u{1D8DC}\u{1DA9C}', 'M': '\u{1D84D}\u{1DA9C}',
        'N': '\u{1D819}\u{1DA9C}', 'O': '\u{1D936}\u{1DA9C}', 'P': '\u{1D900}\u{1DA9C}\u{1DAA1}', 'Q': '\u{1D8F1}\u{1DA9C}\u{1DAA1}',
        'R': '\u{1D81A}\u{1DA9C}', 'S': '\u{1D903}\u{1DA9C}', 'T': '\u{1D8FB}\u{1DA9C}', 'U': '\u{1D815}\u{1DA9C}',
        'V': '\u{1D80E}\u{1DA9C}', 'W': '\u{1D887}\u{1DA9C}', 'X': '\u{1D806}\u{1DA9C}', 'Y': '\u{1D89A}\u{1DA9C}',
        'Z': ' \u{1D945}\u{1DAAA}\n\u{1D800}\u{1DA9C}',
        '.': '\u{1DA88}\u{1DAA2}', ',': '\u{1DA87}\u{1DAA2}', ':': '\u{1DA8A}\u{1DAA2}', ';': '\u{1DA89}\u{1DAA2}',
        '(': '\u{1DA8B}\u{1DAA2}', ')': '\u{1DA8B}\u{1DAA6}', '?': '\u{1D89F}\u{1DA9D}\u{1DAAE}\n\u{1D800}\u{1DA9C}',
        '0': '\u{1D936}\u{1DA9C}', '1': '\u{1D800}\u{1DA9C}', '2': '\u{1D80E}\u{1DA9C}', '3': '\u{1D81E}\u{1DA9C}',
        '4': '\u{1D904}\u{1DA9C}', '5': '\u{1D90C}\u{1DA9C}', '6': '\u{1D887}\u{1DA9C}', '7': '\u{1D8A5}\u{1DA9C}',
        '8': '\u{1D8BB}\u{1DA9C}', '9': '\u{1D8CE}\u{1DA9C}'
    },

    func: function(text: string, options?: Record<string, string>): string {
        var layout = (options && options.layout) || 'horizontal';
        text = text.toUpperCase();

        if (layout === 'vertical') {
            var words = text.split(/\s+/);
            var wordBlocks: string[] = [];
            for (var w = 0; w < words.length; w++) {
                var chars: string[] = [];
                for (var c = 0; c < words[w].length; c++) {
                    var val = this.aslMap[words[w][c]];
                    if (val !== undefined) chars.push(val);
                }
                wordBlocks.push(chars.join('\n\n'));
            }
            return wordBlocks.join('\n\n\n');
        }

        var SPACE_TOKEN = this.NBSP + this.NBSP;
        var signs: string[][] = [];
        for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            if (ch === ' ') {
                signs.push([SPACE_TOKEN]);
            } else {
                var val = this.aslMap[ch];
                if (val !== undefined) {
                    signs.push(val.split('\n'));
                } else {
                    signs.push([ch]);
                }
            }
        }

        var maxH = 1;
        for (var s = 0; s < signs.length; s++) {
            if (signs[s].length > maxH) maxH = signs[s].length;
        }

        var lanes: string[] = [];
        for (var r = 0; r < maxH; r++) lanes.push('');

        for (var s = 0; s < signs.length; s++) {
            var padCount = maxH - signs[s].length;
            var padded: string[] = [];
            for (var p = 0; p < padCount; p++) padded.push(this.NBSP);
            for (var p = 0; p < signs[s].length; p++) padded.push(signs[s][p]);
            for (var r = 0; r < maxH; r++) {
                lanes[r] += padded[r];
            }
        }
        return lanes.join('\n');
    },

    preview: function(text: string): string {
        if (!text) return '[ASL SignWriting]';
        return this.func(text.slice(0, 5));
    }
});
