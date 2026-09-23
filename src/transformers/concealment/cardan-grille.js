// Cardan grille — write/read through a rotating hole template
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const DEFAULT_GRILLE = '#.#.\n.#.#\n#.#.\n.#.#';
    const DEFAULT_FILLER = 'abcdefghijklmnopqrstuvwxyz';

    function parseGrille(pattern, size) {
        const rows = String(pattern || DEFAULT_GRILLE)
            .trim()
            .split(/\r?\n/)
            .map(function(row) { return row.trim(); })
            .filter(function(row) { return row.length > 0; });

        const holes = [];
        for (let r = 0; r < rows.length && r < size; r++) {
            for (let c = 0; c < rows[r].length && c < size; c++) {
                const ch = rows[r][c];
                if (ch === '#' || ch === 'X' || ch === 'x' || ch === '1') {
                    holes.push([r, c]);
                }
            }
        }
        return holes.sort(function(a, b) {
            return a[0] - b[0] || a[1] - b[1];
        });
    }

    function rotateCoord(r, c, size) {
        return [c, size - 1 - r];
    }

    function rotateHoles(holes, size) {
        return holes.map(function(pair) {
            return rotateCoord(pair[0], pair[1], size);
        }).sort(function(a, b) {
            return a[0] - b[0] || a[1] - b[1];
        });
    }

    function makeGrid(size, filler) {
        const grid = [];
        for (let r = 0; r < size; r++) {
            grid.push(new Array(size).fill(''));
        }
        return grid;
    }

    function flattenGrid(grid) {
        return grid.map(function(row) { return row.join(''); }).join('\n');
    }

    function parseGrid(text, size) {
        const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const grid = makeGrid(size);
        let index = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = cleaned[index] || 'x';
                index++;
            }
        }
        return grid;
    }

    function holeSets(baseHoles, size, rotations) {
        const sets = [baseHoles];
        let current = baseHoles;
        for (let i = 1; i < rotations; i++) {
            current = rotateHoles(current, size);
            sets.push(current);
        }
        return sets;
    }

    function nextFillerChar(filler, index) {
        return filler[index % filler.length] || 'x';
    }

    return new BaseTransformer({
        name: 'Cardan Grille',
        priority: 44,
        category: 'concealment',
        description: 'Hide text using a Cardan grille template with optional 90° rotations.',
        inputKind: 'textarea',
        configurableOptions: [
            {
                id: 'gridSize',
                label: 'Grid size',
                type: 'number',
                default: 4,
                min: 3,
                max: 8,
                step: 1
            },
            {
                id: 'rotations',
                label: 'Grille rotations',
                type: 'select',
                default: '4',
                options: [
                    { value: '1', label: '1 (single pass)' },
                    { value: '4', label: '4 (classic Cardan)' }
                ]
            },
            {
                id: 'grille',
                label: 'Grille pattern (# = hole, . = cover)',
                type: 'text',
                default: DEFAULT_GRILLE
            },
            {
                id: 'filler',
                label: 'Decoy letters for empty cells',
                type: 'text',
                default: DEFAULT_FILLER
            },
            {
                id: 'outputFormat',
                label: 'Output layout',
                type: 'select',
                default: 'grid',
                options: [
                    { value: 'grid', label: 'Grid with newlines' },
                    { value: 'flat', label: 'Continuous string' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const size = Math.max(3, Math.min(8, parseInt(options.gridSize, 10) || 4));
            const rotations = Math.max(1, Math.min(4, parseInt(options.rotations, 10) || 4));
            const filler = String(options.filler || DEFAULT_FILLER).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || DEFAULT_FILLER;
            const message = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (!message) {
                return text;
            }

            const baseHoles = parseGrille(options.grille || DEFAULT_GRILLE, size);
            const sets = holeSets(baseHoles, size, rotations);
            const grid = makeGrid(size);
            let msgIndex = 0;
            let fillerIndex = 0;

            sets.forEach(function(holes) {
                holes.forEach(function(pair) {
                    const r = pair[0];
                    const c = pair[1];
                    if (!grid[r][c]) {
                        grid[r][c] = message[msgIndex] || nextFillerChar(filler, fillerIndex++);
                        if (message[msgIndex]) {
                            msgIndex++;
                        }
                    }
                });
            });

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (!grid[r][c]) {
                        grid[r][c] = nextFillerChar(filler, fillerIndex++);
                    }
                }
            }

            if (options.outputFormat === 'flat') {
                return grid.map(function(row) { return row.join(''); }).join('');
            }
            return flattenGrid(grid);
        },
        reverse: function(text, options) {
            options = options || {};
            const size = Math.max(3, Math.min(8, parseInt(options.gridSize, 10) || 4));
            const rotations = Math.max(1, Math.min(4, parseInt(options.rotations, 10) || 4));
            const baseHoles = parseGrille(options.grille || DEFAULT_GRILLE, size);
            const sets = holeSets(baseHoles, size, rotations);
            const grid = parseGrid(text, size);
            let result = '';

            sets.forEach(function(holes) {
                holes.forEach(function(pair) {
                    result += grid[pair[0]][pair[1]] || '';
                });
            });

            return result;
        },
        preview: function(text, options) {
            if (!text) {
                return '[cardan]';
            }
            return this.func(text.slice(0, 8), options);
        },
        detector: function(text) {
            const lines = text.trim().split(/\r?\n/);
            if (lines.length < 3) {
                return false;
            }
            const widths = lines.map(function(line) {
                return line.replace(/\s/g, '').length;
            });
            const first = widths[0];
            return first >= 3 && widths.every(function(width) {
                return width === first;
            });
        }
    });
})();
