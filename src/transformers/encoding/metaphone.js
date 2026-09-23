// Metaphone phonetic encoding
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function metaphoneWord(word) {
        let w = String(word).toUpperCase().replace(/[^A-Z]/g, '');
        if (!w) {
            return '';
        }

        const first = w.charAt(0);
        if (/^[AEIOU]/.test(w)) {
            w = w.replace(/^([AEIOU])/, 'A');
        } else if (w.startsWith('KN') || w.startsWith('GN') || w.startsWith('PN') || w.startsWith('WR') || w.startsWith('AE')) {
            w = w.slice(1);
        }

        let out = first === 'A' && /^[AEIOU]/.test(String(word).toUpperCase()) ? 'A' : first;
        let i = 1;

        while (i < w.length && out.length < 4) {
            const ch = w.charAt(i);
            const next = w.charAt(i + 1);
            const prev = w.charAt(i - 1);

            if ('AEIOU'.indexOf(ch) >= 0) {
                if (i === 0 || prev === 'A') {
                    out += 'A';
                }
                i++;
                continue;
            }

            if (ch === 'B') {
                out += 'P';
                i += next === 'B' ? 2 : 1;
                continue;
            }
            if (ch === 'C') {
                if (next === 'I' || next === 'E' || next === 'Y') {
                    out += 'S';
                } else {
                    out += 'K';
                }
                i += next === 'H' && (next === 'I' || next === 'E' || next === 'Y') ? 2 : 1;
                continue;
            }
            if (ch === 'D') {
                out += next === 'G' && 'EIY'.indexOf(w.charAt(i + 2)) >= 0 ? 'J' : 'T';
                i += next === 'G' ? 3 : 1;
                continue;
            }
            if (ch === 'F') {
                out += 'F';
                i += next === 'F' ? 2 : 1;
                continue;
            }
            if (ch === 'G') {
                if (next === 'H' && 'EIY'.indexOf(w.charAt(i + 2)) < 0) {
                    i += 2;
                    continue;
                }
                if (next === 'N' && w.charAt(i + 2) === 'E' && w.charAt(i + 3) === 'D') {
                    i += 2;
                    continue;
                }
                out += 'K';
                i += next === 'G' ? 2 : 1;
                continue;
            }
            if (ch === 'H') {
                if ('AEIOU'.indexOf(prev) >= 0 && 'AEIOU'.indexOf(next) >= 0) {
                    out += 'H';
                }
                i++;
                continue;
            }
            if (ch === 'J') {
                out += 'J';
                i += next === 'J' ? 2 : 1;
                continue;
            }
            if (ch === 'K') {
                out += 'K';
                i += next === 'K' ? 2 : 1;
                continue;
            }
            if (ch === 'L') {
                out += 'L';
                i += next === 'L' ? 2 : 1;
                continue;
            }
            if (ch === 'M') {
                out += 'M';
                i += next === 'M' ? 2 : 1;
                continue;
            }
            if (ch === 'N') {
                out += 'N';
                i += next === 'N' ? 2 : 1;
                continue;
            }
            if (ch === 'P') {
                out += next === 'H' ? 'F' : 'P';
                i += next === 'H' ? 2 : next === 'P' ? 2 : 1;
                continue;
            }
            if (ch === 'Q') {
                out += 'K';
                i += next === 'Q' ? 2 : 1;
                continue;
            }
            if (ch === 'R') {
                out += 'R';
                i += next === 'R' ? 2 : 1;
                continue;
            }
            if (ch === 'S') {
                out += next === 'H' ? 'X' : 'S';
                i += next === 'H' ? 2 : next === 'S' ? 2 : 1;
                continue;
            }
            if (ch === 'T') {
                if (next === 'I' && 'AO'.indexOf(w.charAt(i + 2)) >= 0) {
                    out += 'X';
                } else if (next === 'H') {
                    out += '0';
                } else if (next === 'C' && w.charAt(i + 2) === 'H') {
                    out += 'X';
                } else {
                    out += 'T';
                }
                i += next === 'H' || (next === 'C' && w.charAt(i + 2) === 'H') ? 2 : next === 'T' ? 2 : 1;
                continue;
            }
            if (ch === 'V') {
                out += 'F';
                i += next === 'V' ? 2 : 1;
                continue;
            }
            if (ch === 'W') {
                if ('AEIOU'.indexOf(next) >= 0) {
                    out += 'W';
                }
                i++;
                continue;
            }
            if (ch === 'X') {
                out += 'KS';
                i += next === 'X' ? 2 : 1;
                continue;
            }
            if (ch === 'Y') {
                if ('AEIOU'.indexOf(next) >= 0) {
                    out += 'Y';
                }
                i++;
                continue;
            }
            if (ch === 'Z') {
                out += 'S';
                i += next === 'Z' ? 2 : 1;
                continue;
            }
            i++;
        }

        return out.slice(0, 4);
    }

    return new BaseTransformer({
        name: 'Metaphone',
        priority: 50,
        category: 'format',
        canDecode: false,
        description: 'Phonetic encoding for English words (Metaphone algorithm).',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Word separator',
                type: 'select',
                default: ' ',
                options: [
                    { value: ' ', label: 'Space' },
                    { value: '-', label: 'Dash' },
                    { value: ',', label: 'Comma' },
                    { value: '', label: 'None' }
                ]
            },
            {
                id: 'uppercase',
                label: 'Uppercase output',
                type: 'boolean',
                default: true
            }
        ],
        func: function(text, options) {
            options = options || {};
            const separator = options.separator != null ? String(options.separator) : ' ';
            const uppercase = options.uppercase !== false;
            const encoded = text.split(/\s+/).map(function(word) {
                return metaphoneWord(word);
            }).filter(Boolean);
            let out = encoded.join(separator);
            return uppercase ? out.toUpperCase() : out.toLowerCase();
        },
        preview: function(text, options) {
            if (!text) {
                return '[metaphone]';
            }
            return this.func(text.slice(0, 30), options);
        }
    });
})();
