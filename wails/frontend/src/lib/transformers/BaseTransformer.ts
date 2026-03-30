/**
 * Base Transformer Class
 *
 * Provides default implementations and structure for all text transformers.
 *
 * USAGE:
 *
 * 1. Simple character map transformer (auto-generates reverse):
 *
 *    export default new BaseTransformer({
 *        name: 'My Transform',
 *        priority: 85,
 *        map: { 'a': 'α', 'b': 'β', ... },
 *        func: function(text: string): string {
 *            return [...text].map(c => this.map[c] || c).join('');
 *        }
 *    });
 *
 * 2. Custom transformer with manual reverse:
 *
 *    export default new BaseTransformer({
 *        name: 'ROT13',
 *        priority: 60,
 *        func: function(text: string): string { ... },
 *        reverse: function(text: string): string { ... }
 *    });
 *
 * 3. Encoding-only transformer (no reverse):
 *
 *    export default new BaseTransformer({
 *        name: 'Random Mix',
 *        priority: 0,
 *        canDecode: false,
 *        func: function(text: string): string { ... }
 *    });
 *
 * 4. Transform with user options (gear icon in UI) and optional input kind:
 *
 *    export default new BaseTransformer({
 *        name: 'Binary',
 *        inputKind: 'textarea', // 'textarea' | 'text' — main transform input when active
 *        configurableOptions: [
 *            { id: 'byteSpacing', label: 'Space between bytes', type: 'boolean', default: true }
 *        ],
 *        func: function(text: string, options?: TransformOptions): string { ... }
 *    });
 */

export interface SelectOption {
    value: string;
    label: string;
}

export interface ConfigurableOption {
    id: string;
    label: string;
    type: 'boolean' | 'select' | 'text' | 'number';
    default: boolean | string | number;
    options?: SelectOption[];
    min?: number;
    max?: number;
    step?: number;
}

export type TransformOptions = Record<string, boolean | string | number>;

export interface TransformerConfig {
    name: string;
    func: (this: BaseTransformer, text: string, options?: TransformOptions) => string;
    priority?: number;
    map?: Record<string, string>;
    reverse?: (this: BaseTransformer, text: string, options?: TransformOptions) => string;
    preview?: (this: BaseTransformer, text: string, options?: TransformOptions) => string;
    detector?: (this: BaseTransformer, text: string) => boolean;
    canDecode?: boolean;
    category?: string;
    description?: string;
    inputKind?: 'textarea' | 'text';
    configurableOptions?: ConfigurableOption[];
    [key: string]: any;
}

export class BaseTransformer {
    name!: string;
    priority!: number;
    canDecode!: boolean;
    map?: Record<string, string>;
    category?: string;
    description?: string;
    inputKind?: 'textarea' | 'text';
    configurableOptions?: ConfigurableOption[];
    func!: (text: string, options?: TransformOptions) => string;
    preview!: (text: string, options?: TransformOptions) => string;
    detector: ((text: string) => boolean) | null = null;
    reverse: ((text: string, options?: TransformOptions) => string) | null = null;
    private _reverseMap?: Record<string, string>;

    [key: string]: any;

    /**
     * Create a new transformer
     * @param config - Transformer configuration
     */
    constructor(config: TransformerConfig) {
        if (!config.name || !config.func) {
            throw new Error('Transformer requires at least "name" and "func"');
        }

        // Copy ALL config properties to instance first (for custom properties like alphabet, etc.)
        Object.assign(this, config);

        // Override with properly bound functions
        this.func = config.func.bind(this);
        this.priority = config.priority ?? 85; // Default: Unicode transformations
        this.canDecode = config.canDecode ?? true;

        // Preview function (defaults to func)
        if (config.preview) {
            this.preview = config.preview.bind(this);
        } else {
            this.preview = this.func;
        }

        // Detector function (for universal decoder)
        if (config.detector) {
            this.detector = config.detector.bind(this);
        } else {
            this.detector = null;
        }

        // Reverse/decode function
        if (!this.canDecode) {
            // Explicitly cannot decode
            this.reverse = null;
        } else if (config.reverse) {
            // Custom reverse function provided
            this.reverse = config.reverse.bind(this);
        } else if (config.map) {
            // Auto-generate reverse from character map
            this.reverse = this._autoReverse.bind(this);
        } else {
            // No reverse available (but might be added later)
            this.reverse = null;
        }
    }

    /**
     * Auto-generated reverse function for character map transformers
     * Builds a reverse map and decodes character-by-character
     * @private
     */
    _autoReverse(text: string): string {
        if (!this.map) return text;

        // Build reverse map (cached for performance)
        if (!this._reverseMap) {
            this._reverseMap = {};
            for (const [key, value] of Object.entries(this.map)) {
                this._reverseMap[value] = key;
            }
        }

        return [...text].map(c => this._reverseMap![c] || c).join('');
    }

    /**
     * Get transformer info as JSON
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            priority: this.priority,
            canDecode: this.canDecode,
            category: this.category,
            description: this.description,
            hasMap: !!this.map,
            hasReverse: !!this.reverse
        };
    }
}

/**
 * PRIORITY GUIDE:
 *
 * 310 = Semaphore Flags (only 8 specific arrow emojis)
 * 300 = Exclusive character sets (Binary, Morse, Braille, Brainfuck, Tap Code)
 * 290 = Hexadecimal
 * 285 = Pattern-based (Pig Latin, Dovahzul)
 * 280 = Base32
 * 270-275 = Base64/Base58 family
 * 260 = A1Z26
 * 150 = Active transform (user context)
 * 100 = High confidence (Emoji Steganography, unique Unicode ranges)
 * 85 = Unicode transformations (default for fancy text)
 * 70 = Common encodings (URL, HTML, ASCII85)
 * 60 = Ciphers (ROT13, Caesar)
 * 50 = Generic text transforms
 * 20 = Low confidence generic
 * 1 = Invisible text (last resort)
 * 0 = Cannot decode / encode-only
 */

export default BaseTransformer;
