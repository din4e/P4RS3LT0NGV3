// Typoglycemia — scramble middle letters while keeping first/last
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function hashString(str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function seededShuffle(arr, seed) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
            const j = seed % (i + 1);
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    function scrambleWord(word, minLength) {
        if (word.length < minLength) {
            return word;
        }
        const first = word.charAt(0);
        const last = word.charAt(word.length - 1);
        const middle = word.slice(1, -1).split('');
        return first + seededShuffle(middle, hashString(word)).join('') + last;
    }

    return new BaseTransformer({
        name: 'Typoglycemia',
        priority: 50,
        category: 'format',
        canDecode: false,
        description: 'Reorder inner letters of each word — readable but scrambled (deterministic shuffle).',
        configurableOptions: [
            {
                id: 'minLength',
                label: 'Minimum word length to scramble',
                type: 'number',
                default: 4,
                min: 3,
                max: 12,
                step: 1
            }
        ],
        func: function(text, options) {
            options = options || {};
            const minLength = Math.max(3, Math.min(12, parseInt(options.minLength, 10) || 4));
            return text.replace(/[a-zA-Z]+/g, function(word) {
                return scrambleWord(word, minLength);
            });
        },
        preview: function(text, options) {
            if (!text) {
                return '[typoglycemia]';
            }
            return this.func(text.slice(0, 40), options);
        }
    });
})();
