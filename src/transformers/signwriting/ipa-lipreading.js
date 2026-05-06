// IPA Lip-Reading SignWriting transform
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'IPA Lip-Reading',
    priority: 0,
    canDecode: false,
    description: 'Converts IPA phonetic text to SignWriting lip-reading mouth shapes (ISWA 2010 head/face symbols).',

    HEAD: '񉷿',
    EYE: '𪨔',

    ipaToSw: {
        'p': '𪩓𪩵', 'b': '𪩓𪩮', 'm': '𪩓𪩳',
        'ɗ': '𪩓𪩮', '⦙': '𪩓𪩮', 'ɸ': '𪩓𪩵𪪛', 'β': '𪩓𪩮',
        'f': '𪩥𪩵', 'v': '𪩥𪩮', 'ʋ': '𪩥𪩮', 'ɱ': '𪩥𪩳',
        'θ': '𪩛𪩵', 'ð': '𪩛𪩮',
        't': '𪩜𪩵', 'd': '𪩜𪩮', 'n': '𪩜𪩳',
        's': '񈴀𪩵𪪛', 'z': '񈴀𪩮', 'l': '𪩜𪪤', 'r': '𪩟', 'ɾ': '𪩟', 'ɻ': '𪩟',
        'ʂ': '𪩍𪩵𪪛', 'ʒ': '𪩍𪩮',
        'c': '񈴀𪩵', 'ɟ': '񈴀𪩮', 'ɲ': '񈴀𪩳', 'ç': '񈴀𪩵𪪛', 'ʝ': '񈴀𪩮', 'j': '񈴀', 'ʎ': '񈴀',
        'k': '񈴄𪩵', 'g': '񈴄𪩮', 'ŋ': '񈴄𪩳', 'x': '񈴄𪩵𪪛', 'ɣ': '񈴄𪩮', 'w': '񈴆', 'ʍ': '񈴆',
        'q': '񈴉𪩵', 'ɢ': '񈴉𪩮', 'ɴ': '񈴉𪩳', 'χ': '񈴉𪩵𪪛', 'ʁ': '񈴉𪩮', 'ʀ': '񈴉𪩮',
        'ʕ': '𪩌𪩮', 'ħ': '𪩌𪩮', 'ʔ': '𪩡', 'h': '񈴄𪩵𪪛', 'ɦ': '񈴄𪩵𪪛',
        'i': '񈴀', 'y': '񈴆', 'ɨ': '񈴀', 'ʉ': '񈴆', 'ɯ': '񈴐', 'u': '񈴆',
        'ɪ': '񈴊', 'ʏ': '񈴇', 'ʊ': '񈴇',
        'e': '񈴊', 'ø': '񈴇', 'ɘ': '񈴊', 'ɵ': '񈴇', 'ɤ': '񈴊', 'o': '񈴇', 'ə': '񈴊', 'ɚ': '񈴊',
        'ɛ': '񈴈', 'œ': '񈴈', 'ɜ': '񈴈', 'ɞ': '񈴈', 'ʌ': '񈴉', 'ɔ': '񈴉',
        'a': '𪩌', 'ɶ': '𪩌', 'ä': '𪩌', 'ɑ': '𪩌', 'ɒ': '𪩌', 'æ': '𪩌', 'ɐ': '𪩌',
        'ǀ': '𪩓𪩶', 'ǁ': '𪩣𪩶', 'ǃ': '𪩡𪩶', 'ǂ': '𪩡𪩶'
    },

    diphthongs: {
        'aɪ': ['𪩌', '񈴀'], 'aʊ': ['𪩌', '񈴆'], 'eɪ': ['񈴊', '񈴀'],
        'oʊ': ['񈴇', '񈴆'], 'ɔɪ': ['񈴉', '񈴀'], 'əʊ': ['񈴊', '񈴆'],
        'ɪə': ['񈴊', '񈴊'], 'eə': ['񈴊', '𪩌'], 'ʊə': ['񈴇', '񈴊']
    },

    skipChars: { 'ˈ': 1, 'ˌ': 1, 'ː': 1, ' ': 1, '\t': 1, '\n': 1 },

    func: function(text) {
        var result = [], i = 0, HEAD = this.HEAD, EYE = this.EYE;
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
                result.push(HEAD + EYE + '𪩻');
            }
        }
        return result.join(' ');
    },

    preview: function(text) {
        if (!text) return '[IPA Lip-Reading]';
        return this.func(text.slice(0, 8));
    }
});
