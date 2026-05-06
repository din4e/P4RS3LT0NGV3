// @ts-nocheck
// JSL SignWriting transform
import { BaseTransformer } from '../BaseTransformer';

export const jslSignwriting = new BaseTransformer({
    name: 'JSL SignWriting',
    priority: 0,
    canDecode: false,
    category: 'signwriting',
    description: 'Japanese Sign Language fingerspelling in SignWriting (ISWA 2010). Hiragana input.',
    configurableOptions: [
        { id: 'layout', label: 'Layout', type: 'select', default: 'horizontal',
          options: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }] }
    ],
    NBSP: ' ',
    SEP: ' ',
    jslMap: {
        'あ': ['\u{1D8F7}\u{1DA9C}'], 'ぁ': ['\u{1D965}\u{1DAA4}', '\u{1D8F7}\u{1DA9C}'], 'い': ['\u{1D892}\u{1DA9C}'], 'ぃ': ['\u{1D965}\u{1DAA4}', '\u{1D892}\u{1DA9C}'],
        'う': ['\u{1D815}\u{1DA9C}'], 'ぅ': ['\u{1D965}\u{1DAA4}', '\u{1D815}\u{1DA9C}'], 'え': ['\u{1D926}\u{1DA9C}'], 'ぇ': ['\u{1D965}\u{1DAA4}', '\u{1D926}\u{1DA9C}'],
        'お': ['\u{1D936}\u{1DA9B}'], 'ぉ': ['\u{1D965}\u{1DAA4}', '\u{1D936}\u{1DA9B}'], 'か': ['\u{1D900}\u{1DA9C}'], 'か': ['\u{1D965}\u{1DAA4}', '\u{1D900}\u{1DA9C}'],
        'き': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}'], 'く': ['\u{1D91D}\u{1DAA2}'], 'け': ['\u{1D907}\u{1DA9C}'], 'ざ': ['\u{1D965}\u{1DAA4}', '\u{1D907}\u{1DA9C}'],
        'こ': ['\u{1D880}\u{1DA9B}'], 'さ': ['\u{1D903}\u{1DA9C}'], 'し': ['\u{1D81E}\u{1DAA2}'], 'す': ['\u{1D81E}\u{1DAA4}'], 'せ': ['\u{1D8C6}\u{1DA9C}'], 'そ': ['\u{1D800}\u{1DAA0}'],
        'た': ['\u{1D8F7}\u{1DAA0}'], 'ち': ['\u{1D896}\u{1DA9C}'], 'つ': ['\u{1D8B3}\u{1DA9C}'], 'っ': ['\u{1D965}\u{1DAA4}', '\u{1D8B3}\u{1DA9C}'],
        'て': ['\u{1D90C}\u{1DA9C}'], 'と': ['\u{1D815}'], 'な': ['\u{1D80E}\u{1DAA4}'], 'に': ['\u{1D80E}\u{1DAA2}'], 'ぬ': ['\u{1D806}\u{1DA9B}'], 'ね': ['\u{1D90C}\u{1DAA4}'],
        'の': ['\u{1D92A}\u{1DAA3}', '\u{1D800}\u{1DA9B}'], 'は': ['\u{1D815}\u{1DAA0}'], 'ひ': ['\u{1D800}\u{1DA9C}'], 'ふ': ['\u{1D8F0}\u{1DA9F}\u{1DAA1}'], 'へ': ['\u{1D89A}\u{1DA9F}'], 'ほ': ['\u{1D880}\u{1DA9D}'],
        'ま': ['\u{1D84C}\u{1DAA4}'], 'み': ['\u{1D84C}\u{1DAA2}'], 'む': ['\u{1D8DC}\u{1DAA2}'], 'め': ['\u{1D8CE}\u{1DA9C}'], 'も': ['\u{1D92A}\u{1DAA4}', '\u{1D91C}\u{1D8F4}\u{1DA9D}\u{1DAA6}'],
        'や': ['\u{1D89A}\u{1DA9C}'], 'ゃ': ['\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'ゆ': ['\u{1D84C}'], 'ゅ': ['\u{1D965}\u{1DAA4}', '\u{1D84C}'],
        'よ': ['\u{1D904}\u{1DAA2}'], 'ょ': ['\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'], 'ら': ['\u{1D81A}\u{1DA9C}'], 'り': ['\u{1D8A2}\u{1DAAE}', '\u{1D80E}\u{1DAA0}'], 'る': ['\u{1D81E}\u{1DA9C}'],
        'れ': ['\u{1D8DC}\u{1DA9C}'], 'ろ': ['\u{1D810}\u{1DA9B}'], 'わ': ['\u{1D886}\u{1DA9C}'], 'ゎ': ['\u{1D965}\u{1DAA4}', '\u{1D886}\u{1DA9C}'],
        'ゐ': ['\u{1D965}\u{1DAA4}', '\u{1D892}\u{1DA9C}'], 'ゑ': ['\u{1D965}\u{1DAA4}', '\u{1D926}\u{1DA9C}'], 'を': ['\u{1D965}\u{1DAA4}', '\u{1D936}\u{1DA9B}'],
        'ん': ['\u{1D8A2}\u{1DAA4}', '\u{1D800}\u{1DAA0}'],
        'が': ['\u{1D900}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'ぎ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}\u{1D965}\u{1DAA6}'], 'ぐ': ['\u{1D91D}\u{1DAA2}\u{1D965}\u{1DAA6}'], 'げ': ['\u{1D907}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'ご': ['\u{1D880}\u{1DA9B}\u{1D965}\u{1DAA6}'],
        'ざ': ['\u{1D903}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'じ': ['\u{1D81E}\u{1DAA2}\u{1D965}\u{1DAA6}'], 'ず': ['\u{1D81E}\u{1DAA4}\u{1D965}\u{1DAA6}'], 'ぜ': ['\u{1D8C6}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'ぞ': ['\u{1D800}\u{1DAA0}\u{1D965}\u{1DAA6}'],
        'だ': ['\u{1D8F7}\u{1DAA0}\u{1D965}\u{1DAA6}'], 'ぢ': ['\u{1D896}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'づ': ['\u{1D8B3}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'で': ['\u{1D90C}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'ど': ['\u{1D815}\u{1D965}\u{1DAA6}'],
        'ば': ['\u{1D815}\u{1DAA0}\u{1D965}\u{1DAA6}'], 'び': ['\u{1D800}\u{1DA9C}\u{1D965}\u{1DAA6}'], 'ぶ': ['\u{1D8F0}\u{1DA9F}\u{1DAA1}\u{1D965}\u{1DAA6}'], 'べ': ['\u{1D89A}\u{1DA9F}\u{1D965}\u{1DAA6}'], 'ぼ': ['\u{1D880}\u{1DA9D}\u{1D965}\u{1DAA6}'],
        'ぱ': ['\u{1D92A}', '\u{1D815}\u{1DAA0}'], 'ぴ': ['\u{1D92A}', '\u{1D800}\u{1DA9C}'], 'ぷ': ['\u{1D92A}', '\u{1D8F0}\u{1DA9F}\u{1DAA1}'], 'ぺ': ['\u{1D92A}', '\u{1D89A}\u{1DA9F}'], 'ぽ': ['\u{1D92A}', '\u{1D880}\u{1DA9D}'],
        'ー': ['\u{1D965}\u{1DAA4}'],
        '0': ['\u{1D80A}\u{1DA9B}'], '1': ['\u{1D800}\u{1DA9C}'], '2': ['\u{1D80E}\u{1DA9C}'], '3': ['\u{1D886}\u{1DA9C}'], '4': ['\u{1D904}\u{1DA9C}'],
        '5': ['\u{1D8F7}\u{1DA9C}'], '6': ['\u{1D8DC}\u{1DAA2}'], '7': ['\u{1D81E}\u{1DAA2}'], '8': ['\u{1D8CE}\u{1DAA2}'], '9': ['\u{1D91D}\u{1DAA2}'],
        ' ': [' ']
    },
    jslDigraph: {
        'きゃ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'きゅ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'きょ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'しゃ': ['\u{1D81E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'しゅ': ['\u{1D81E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'しょ': ['\u{1D81E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'ちゃ': ['\u{1D896}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'ちゅ': ['\u{1D896}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'ちょ': ['\u{1D896}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'にゃ': ['\u{1D80E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'にゅ': ['\u{1D80E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'にょ': ['\u{1D80E}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'ひゃ': ['\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'ひゅ': ['\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'ひょ': ['\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'みゃ': ['\u{1D84C}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'みゅ': ['\u{1D84C}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'], 'みょ': ['\u{1D84C}\u{1DAA2}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'りゃ': ['\u{1D8A2}\u{1DAAE}', '\u{1D80E}\u{1DAA0}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'りゅ': ['\u{1D8A2}\u{1DAAE}', '\u{1D80E}\u{1DAA0}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'],
        'りょ': ['\u{1D8A2}\u{1DAAE}', '\u{1D80E}\u{1DAA0}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'ぎゃ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'ぎゅ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'],
        'ぎょ': ['\u{1D8EE}\u{1DA9C}\u{1DAA6}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'じゃ': ['\u{1D81E}\u{1DAA2}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'じゅ': ['\u{1D81E}\u{1DAA2}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'],
        'じょ': ['\u{1D81E}\u{1DAA2}\u{1D965}\u{1DAA6}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}'],
        'ぴゃ': ['\u{1D92A}', '\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D89A}\u{1DA9C}'], 'ぴゅ': ['\u{1D92A}', '\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D84C}'],
        'ぴょ': ['\u{1D92A}', '\u{1D800}\u{1DA9C}', '\u{1D965}\u{1DAA4}', '\u{1D904}\u{1DAA2}']
    },
    tokenize: function(text: string): string[][] {
        var out: string[][] = [], i = 0;
        while (i < text.length) {
            if (i + 1 < text.length && this.jslDigraph[text[i] + text[i + 1]]) {
                out.push(this.jslDigraph[text[i] + text[i + 1]]); i += 2;
            } else {
                out.push(this.jslMap[text[i]] || [text[i]]); i++;
            }
        }
        return out;
    },
    func: function(text: string, options?: Record<string, string>): string {
        var layout = (options && options.layout) || 'horizontal';
        if (layout === 'vertical') {
            var words = text.split(/\s+/), wb: string[] = [];
            for (var w = 0; w < words.length; w++) {
                var tok = this.tokenize(words[w]), cb: string[] = [];
                for (var t = 0; t < tok.length; t++) cb.push(tok[t].join('\n'));
                wb.push(cb.join('\n\n'));
            }
            return wb.join('\n\n\n');
        }
        var tokens = this.tokenize(text), maxH = 1;
        for (var t = 0; t < tokens.length; t++) if (tokens[t].length > maxH) maxH = tokens[t].length;
        var lanes: string[][] = [];
        for (var r = 0; r < maxH; r++) lanes.push([]);
        for (var t = 0; t < tokens.length; t++) {
            var pad = maxH - tokens[t].length, padded: string[] = [];
            for (var p = 0; p < pad; p++) padded.push('');
            for (var p = 0; p < tokens[t].length; p++) padded.push(tokens[t][p]);
            for (var r = 0; r < maxH; r++) lanes[r].push(padded[r] || this.NBSP);
        }
        return lanes.map(function(l: string[]) { return l.join(' '); }).join('\n');
    },
    preview: function(text: string): string {
        if (!text) return '[JSL SignWriting]';
        return this.func(text.slice(0, 5));
    }
});
