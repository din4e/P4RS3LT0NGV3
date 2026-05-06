// @ts-nocheck
// LIBRAS SignWriting transform
import { BaseTransformer } from '../BaseTransformer';

export const librasSignwriting = new BaseTransformer({
    name: 'LIBRAS SignWriting',
    priority: 0,
    canDecode: false,
    category: 'signwriting',
    description: 'Brazilian Sign Language (Libras) fingerspelling in SignWriting (ISWA 2010). Horizontal or vertical layout.',
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

    NBSP: ' ',

    librasMap: {
        'A': ['\u{1D8F7}\u{1DA9C}'], 'B': ['\u{1D907}\u{1DA9C}'], 'C': ['\u{1D92D}\u{1DA9C}'],
        'D': ['\u{1D801}\u{1DA9C}'], 'E': ['\u{1D90A}\u{1DA9C}'],
        'F': ['\u{1D8D2}\u{1DA9C}'], 'G': ['\u{1D8DF}\u{1DA9C}'], 'H': ['\u{1D9DF}', '\u{1D900}\u{1DA9C}\u{1DAA7}'],
        'I': ['\u{1D892}\u{1DA9C}'], 'J': ['\u{1D892}\u{1DA9F}', '\u{1D8A2}\u{1DAAE}'], 'K': ['\u{1D92E}', '\u{1D900}\u{1DA9C}'],
        'L': ['\u{1D8DC}\u{1DA9C}'], 'M': ['\u{1D84D}\u{1DA9C}'], 'N': ['\u{1D819}\u{1DA9C}'],
        'O': ['\u{1D936}\u{1DA9C}'], 'P': ['\u{1D900}\u{1DA9F}'], 'Q': ['\u{1D8F2}\u{1DA9F}'],
        'R': ['\u{1D81A}\u{1DA9C}'], 'S': ['\u{1D903}\u{1DA9C}'], 'T': ['\u{1D8D3}\u{1DA9C}'],
        'U': ['\u{1D815}\u{1DA9C}'], 'V': ['\u{1D80E}\u{1DA9C}'], 'W': ['\u{1D887}\u{1DA9C}'],
        'X': ['\u{1D80A}\u{1DA9F}', '\u{1D965}\u{1DAA4}'], 'Y': ['\u{1D89A}\u{1DA9C}'],
        'Z': [' \u{1D945}\u{1DAAA}', '\u{1D800}\u{1DA9C}'],
        '0': ['\u{1D936}\u{1DA9C}'], '1': ['\u{1D800}'], '2': ['\u{1D80E}'], '3': ['\u{1D886}'],
        '4': ['\u{1D904}'], '5': ['\u{1D810}\u{1DAA8}'], '6': ['\u{1D874}\u{1DA9D}\u{1DAAE}'],
        '7': ['\u{1D883}\u{1DA9B}'], '8': ['\u{1D9E2}\u{1DA9D}', '\u{1D903}\u{1DA9B}'], '9': ['\u{1D935}\u{1DA9F}\u{1DAA2}']
    },

    stripDiacritics: function(text: string): string {
        var decomposed = text.normalize('NFD');
        var out = '';
        for (var i = 0; i < decomposed.length; i++) {
            var cp = decomposed.charCodeAt(i);
            if (cp < 0x0300 || cp > 0x036F) {
                out += decomposed[i];
            }
        }
        return out;
    },

    func: function(text: string, options?: Record<string, string>): string {
        var layout = (options && options.layout) || 'horizontal';
        text = this.stripDiacritics(text).toUpperCase();

        if (layout === 'vertical') {
            var words = text.split(/\s+/);
            var wordBlocks: string[] = [];
            for (var w = 0; w < words.length; w++) {
                var chars: string[] = [];
                for (var c = 0; c < words[w].length; c++) {
                    var sign = this.librasMap[words[w][c]];
                    if (sign) chars.push(sign.join('\n'));
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
                var sign = this.librasMap[ch];
                if (sign) {
                    signs.push(sign.slice());
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
        if (!text) return '[LIBRAS SignWriting]';
        return this.func(text.slice(0, 5));
    }
});
