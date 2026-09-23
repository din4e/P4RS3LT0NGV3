// Book cipher (word indices in reference text)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const DEFAULT_BOOK = 'the quick brown fox jumps over the lazy dog hello world while pack my box with five dozen liquor jugs';

    return new BaseTransformer({
        name: 'Book Cipher',
        priority: 55,
        category: 'cipher',
        configurableOptions: [
            { id: 'book', label: 'Reference text (book)', type: 'text', default: DEFAULT_BOOK },
            {
                id: 'separator',
                label: 'Index separator',
                type: 'select',
                default: ' ',
                options: [
                    { value: ' ', label: 'Space' },
                    { value: '-', label: 'Dash' },
                    { value: '.', label: 'Dot' }
                ]
            }
        ],
        _bookWords: function(options) {
            const book = String(options && options.book != null ? options.book : DEFAULT_BOOK).toLowerCase();
            return book.match(/[a-z0-9']+/g) || [];
        },
        func: function(text, options) {
            options = options || {};
            const words = this._bookWords(options);
            const sep = options.separator != null ? String(options.separator) : ' ';
            if (!words.length) return text;
            const inputWords = text.match(/[a-zA-Z0-9']+/g) || [];
            const indices = inputWords.map(w => {
                const target = w.toLowerCase();
                const idx = words.indexOf(target);
                return idx >= 0 ? String(idx + 1) : '?';
            });
            return indices.join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const words = this._bookWords(options);
            if (!words.length) return text;
            const sep = options.separator != null ? String(options.separator) : ' ';
            const esc = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = text.trim().split(new RegExp(esc.length ? esc : '\\s+'));
            return parts.map(p => {
                const n = parseInt(p, 10);
                if (!Number.isFinite(n) || n < 1 || n > words.length) return p;
                return words[n - 1];
            }).join(' ');
        },
        preview: function(text, options) {
            if (!text) return '[book]';
            return this.func(text.slice(0, 20), options).slice(0, 20) + '...';
        },
        detector: function(text) {
            const cleaned = text.trim();
            return /^[\d\s.\-]+$/.test(cleaned) && cleaned.replace(/\D/g, '').length >= 2;
        }
    });
})();
