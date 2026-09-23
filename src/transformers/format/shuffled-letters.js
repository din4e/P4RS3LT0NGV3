// Shuffle letters within each word (seeded for reversible decode)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function seededRandom(seed) {
        let s = seed >>> 0;
        return function() {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function shuffleWord(word, seed) {
        const chars = [...word];
        const rand = seededRandom(seed);
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
    }

    function unshuffleWord(word, seed) {
        const n = word.length;
        const rand = seededRandom(seed);
        const swaps = [];
        for (let i = n - 1; i > 0; i--) {
            swaps.push([i, Math.floor(rand() * (i + 1))]);
        }
        const chars = [...word];
        for (let s = swaps.length - 1; s >= 0; s--) {
            const [i, j] = swaps[s];
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
    }

    return new BaseTransformer({
        name: 'Shuffled Letters',
        priority: 58,
        category: 'format',
        configurableOptions: [
            {
                id: 'seed',
                label: 'Shuffle seed (same seed to decode)',
                type: 'number',
                default: 42,
                min: 0,
                max: 999999
            }
        ],
        func: function(text, options) {
            options = options || {};
            const seed = Number(options.seed);
            const base = Number.isFinite(seed) ? seed : 42;
            let wi = 0;
            return text.replace(/\S+/g, w => shuffleWord(w, base + wi++));
        },
        reverse: function(text, options) {
            options = options || {};
            const seed = Number(options.seed);
            const base = Number.isFinite(seed) ? seed : 42;
            let wi = 0;
            return text.replace(/\S+/g, w => unshuffleWord(w, base + wi++));
        },
        preview: function(text, options) {
            if (!text) return '[shuffle]';
            return this.func(text.slice(0, 20), options);
        },
        detector: function(text) {
            return false;
        }
    });
})();
