// @ts-nocheck
// IPA Lip-Reading SignWriting transform
import { BaseTransformer } from '../BaseTransformer';

export const ipaLipreading = new BaseTransformer({
    name: 'IPA Lip-Reading',
    priority: 0,
    canDecode: false,
    category: 'signwriting',
    description: 'Converts IPA phonetic text to SignWriting lip-reading mouth shapes (ISWA 2010 head/face symbols).',

    HEAD: '\u{1D9FF}',
    EYE: '\u{1DA14}',

    ipaToSw: {
        'p': '\u{1DA53}\u{1DA75}', 'b': '\u{1DA53}\u{1DA6E}', 'm': '\u{1DA53}\u{1DA73}',
        'ɗ': '\u{1DA53}\u{1DA6E}', '⦙': '\u{1DA53}\u{1DA6E}', 'ɸ': '\u{1DA53}\u{1DA75}\u{1DA9B}', 'β': '\u{1DA53}\u{1DA6E}',
        'f': '\u{1DA65}\u{1DA75}', 'v': '\u{1DA65}\u{1DA6E}', 'ʋ': '\u{1DA65}\u{1DA6E}', 'ɱ': '\u{1DA65}\u{1DA73}',
        'θ': '\u{1DA5B}\u{1DA75}', 'ð': '\u{1DA5B}\u{1DA6E}',
        't': '\u{1DA5C}\u{1DA75}', 'd': '\u{1DA5C}\u{1DA6E}', 'n': '\u{1DA5C}\u{1DA73}',
        's': '\u{1DA00}\u{1DA75}\u{1DA9B}', 'z': '\u{1DA00}\u{1DA6E}', 'l': '\u{1DA5C}\u{1DAA4}', 'r': '\u{1DA5F}', 'ɾ': '\u{1DA5F}', 'ɻ': '\u{1DA5F}', 'ɻ': '\u{1DA5F}',
        'ʃ': '\u{1DA4D}\u{1DA75}\u{1DA9B}', 'ʒ': '\u{1DA4D}\u{1DA6E}',
        'c': '\u{1DA00}\u{1DA75}', 'ɟ': '\u{1DA00}\u{1DA6E}', 'ɲ': '\u{1DA00}\u{1DA73}', 'ç': '\u{1DA00}\u{1DA75}\u{1DA9B}', 'ʝ': '\u{1DA00}\u{1DA6E}', 'j': '\u{1DA00}', 'ʎ': '\u{1DA00}',
        'k': '\u{1DA04}\u{1DA75}', 'g': '\u{1DA04}\u{1DA6E}', 'ŋ': '\u{1DA04}\u{1DA73}', 'x': '\u{1DA04}\u{1DA75}\u{1DA9B}', 'ɣ': '\u{1DA04}\u{1DA6E}', 'w': '\u{1DA06}', 'ʍ': '\u{1DA06}',
        'q': '\u{1DA09}\u{1DA75}', 'ɢ': '\u{1DA09}\u{1DA6E}', 'ɴ': '\u{1DA09}\u{1DA73}', 'χ': '\u{1DA09}\u{1DA75}\u{1DA9B}', 'ʁ': '\u{1DA09}\u{1DA6E}', 'ʀ': '\u{1DA09}\u{1DA6E}',
        'ʕ': '\u{1DA4C}\u{1DA6E}', 'ħ': '\u{1DA4C}\u{1DA6E}', 'ʔ': '\u{1DA61}', 'h': '\u{1DA04}\u{1DA75}\u{1DA9B}', 'ɦ': '\u{1DA04}\u{1DA75}\u{1DA9B}',
        'i': '\u{1DA00}', 'y': '\u{1DA06}', 'ɨ': '\u{1DA00}', 'ʉ': '\u{1DA06}', 'ɯ': '\u{1DA10}', 'u': '\u{1DA06}',
        'ɪ': '\u{1DA0A}', 'ʏ': '\u{1DA07}', 'ʊ': '\u{1DA07}',
        'e': '\u{1DA0A}', 'ø': '\u{1DA07}', 'ɘ': '\u{1DA0A}', 'ɵ': '\u{1DA07}', 'ɤ': '\u{1DA0A}', 'o': '\u{1DA07}', 'ə': '\u{1DA0A}', 'ɚ': '\u{1DA0A}',
        'ɛ': '\u{1DA08}', 'œ': '\u{1DA08}', 'ɜ': '\u{1DA08}', 'ɞ': '\u{1DA08}', 'ʌ': '\u{1DA09}', 'ɔ': '\u{1DA09}',
        'a': '\u{1DA4C}', 'ɶ': '\u{1DA4C}', 'ä': '\u{1DA4C}', 'ɑ': '\u{1DA4C}', 'ɒ': '\u{1DA4C}', 'æ': '\u{1DA4C}', 'ɐ': '\u{1DA4C}',
        'ǀ': '\u{1DA53}\u{1DA76}', 'ǁ': '\u{1DA63}\u{1DA76}', 'ǃ': '\u{1DA61}\u{1DA76}', 'ǂ': '\u{1DA61}\u{1DA76}', 'ǁ': '\u{1DA61}\u{1DA76}'
    },

    diphthongs: {
        'aɪ': ['\u{1DA4C}', '\u{1DA00}'], 'aʊ': ['\u{1DA4C}', '\u{1DA06}'], 'eɪ': ['\u{1DA0A}', '\u{1DA00}'],
        'oʊ': ['\u{1DA07}', '\u{1DA06}'], 'ɔɪ': ['\u{1DA09}', '\u{1DA00}'], 'əʊ': ['\u{1DA0A}', '\u{1DA06}'],
        'ɪə': ['\u{1DA0A}', '\u{1DA0A}'], 'eə': ['\u{1DA0A}', '\u{1DA4C}'], 'ʊə': ['\u{1DA07}', '\u{1DA0A}']
    },

    skipChars: { 'ˈ': 1, 'ˌ': 1, 'ː': 1, ' ': 1, '\t': 1, '\n': 1 },

    func: function(text: string): string {
        var result: string[] = [], i = 0, HEAD = this.HEAD, EYE = this.EYE;
        while (i < text.length) {
            if (this.skipChars[text[i]]) { i++; continue; }
            if (i + 1 < text.length) {
                var di = text[i] + text[i + 1];
                if (this.diphthongs[di]) {
                    var shapes = this.diphthongs[di];
                    for (var s = 0; s < shapes.length; s++) {
                        result.push(HEAD + EYE + shapes[s]);
                        if (s < shapes.length - 1) result.push('→');
                    }
                    i += 2; continue;
                }
            }
            var ch = text[i]; i++;
            if (this.ipaToSw[ch]) {
                result.push(HEAD + EYE + this.ipaToSw[ch]);
            } else {
                result.push(HEAD + EYE + '\u{1DA7B}');
            }
        }
        return result.join(' ');
    },

    preview: function(text: string): string {
        if (!text) return '[IPA Lip-Reading]';
        return this.func(text.slice(0, 8));
    }
});
