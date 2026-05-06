// @ts-nocheck
// whitespace steganography transform
import { BaseTransformer } from '../BaseTransformer';

export const whitespaceSteganography = new BaseTransformer({
    name: 'Whitespace Steganography',
    priority: 100,
    category: 'format',
    func: function(text: string): string {
        // Encode text in whitespace patterns (space = 0, tab = 1)
        const bytes = new TextEncoder().encode(text);
        let result = '';
        
        for (const byte of bytes) {
            // Encode each byte as 8 characters (space or tab)
            for (let i = 7; i >= 0; i--) {
                const bit = (byte >> i) & 1;
                result += bit === 1 ? '\t' : ' ';
            }
        }
        
        return result;
    },
    reverse: function(text: string): string {
        // Decode whitespace patterns back to text
        const bytes = [];
        let bitBuffer = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ' || char === '\t') {
                bitBuffer += char === '\t' ? '1' : '0';
                
                // Every 8 bits, convert to a byte
                if (bitBuffer.length === 8) {
                    bytes.push(parseInt(bitBuffer, 2));
                    bitBuffer = '';
                }
            }
        }
        
        try {
            return new TextDecoder().decode(new Uint8Array(bytes));
        } catch (e) {
            return '';
        }
    },
    preview: function(text: string): string {
        if (!text) return '[whitespace-stego]';
        return this.func(text.slice(0, 1)) + '...';
    },
    detector: function(text: string): boolean {
        // Check if text is mostly spaces and tabs in groups of 8
        const cleaned = text.replace(/[^\s\t]/g, '');
        if (cleaned.length < 8) return false;
        // Should be mostly whitespace
        return cleaned.length / text.length > 0.8;
    }
});

