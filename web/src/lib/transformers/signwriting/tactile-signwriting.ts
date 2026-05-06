// @ts-nocheck
// Deafblind Tactile SignWriting transform
import { BaseTransformer } from '../BaseTransformer';

export const tactileSignwriting = new BaseTransformer({
    name: 'Tactile SignWriting',
    priority: 0,
    canDecode: false,
    category: 'signwriting',
    description: 'Deafblind tactile fingerspelling approximation in SignWriting (ISWA 2010). Two-hand layers per letter.',

    tactileMap: {
        'A': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D8F7}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1D944}'],
        'B': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D936}\u{1DA9E}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'C': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D8DC}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1DAA7}\u{1D942}\u{1D8FB}\u{1DAA9}'],
        'D': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D8E2}\u{1DA9F}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1D846}\u{1DA9E}\u{1DAA8}\u{1D944}'],
        'E': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1D944}'],
        'F': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D815}\u{1DA9F}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1DAA9}\u{1D944}'],
        'G': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D903}\u{1DA9E}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'H': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D90C}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D942}\u{1D966}\u{1DAA7}'],
        'I': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D8C6}\u{1DA9D}\u{1DAA7}\u{1D846}\u{1DA9E}\u{1D944}'],
        'J': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D8C6}\u{1DA9D}\u{1DAA7}\u{1D846}\u{1DA9E}\u{1D942}\u{1D966}\u{1DAA3}\u{1D846}\u{1DA9F}\u{1D978}\u{1DAA7}'],
        'K': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D806}\u{1DA9D}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1DAA9}\u{1D944}'],
        'L': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'M': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D84C}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'N': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D815}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'O': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D8AE}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1D944}'],
        'P': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D8F1}\u{1DA9F}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1DAA2}\u{1D942}\u{1D957}'],
        'Q': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D806}\u{1DA9F}\u{1DAA1}', '\u{1D8F7}\u{1DA9D}\u{1DAA9}\u{1D908}\u{1D9BE}\u{1DAA1}'],
        'R': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D806}\u{1DA9E}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1DAAB}\u{1D944}'],
        'S': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D806}\u{1DA9F}\u{1DAA1}', '\u{1D892}\u{1DA9D}\u{1DAA9}\u{1D908}\u{1D9BE}\u{1DAA1}'],
        'T': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1DAAB}\u{1D944}'],
        'U': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D892}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1D944}'],
        'V': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D80E}\u{1DA9F}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}'],
        'W': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D90E}\u{1DA9F}\u{1DAA1}', '\u{1D91D}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1DAA1}\u{1D908}'],
        'X': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D800}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9E}\u{1DAA9}\u{1D944}'],
        'Y': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D800}\u{1DA9F}\u{1DAA1}', '\u{1D8F7}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1DAAE}'],
        'Z': ['\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D91A}\u{1DA9E}\u{1DAA1}', '\u{1D90C}\u{1DA9D}\u{1DAA9}\u{1D846}\u{1DA9F}\u{1D944}']
    },

    func: function(text: string): string {
        var upper = text.toUpperCase();
        var blocks: string[] = [];
        for (var i = 0; i < upper.length; i++) {
            var ch = upper[i];
            if (ch === ' ') {
                blocks.push(' \n ');
                continue;
            }
            var sign = this.tactileMap[ch];
            if (sign) {
                blocks.push(sign[0] + '\n' + sign[1]);
            }
        }
        return blocks.join('\n\n');
    },

    preview: function(text: string): string {
        if (!text) return '[Tactile SignWriting]';
        return this.func(text.slice(0, 3));
    }
});
