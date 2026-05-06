// @ts-nocheck
// base32 transform
import { BaseTransformer } from '../BaseTransformer';

export const base32 = new BaseTransformer({
    name: 'Base32',
    priority: 280,
    // Detector: Only Base32 characters (A-Z, 2-7, =)
    detector: function(text: string): boolean {
        const cleaned = text.trim().replace(/\s/g, '');
        return cleaned.length >= 8 && /^[A-Z2-7=]+$/.test(cleaned);
    },
    
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
        func: function(text: string): string {
            if (!text) return '';
            
            // Convert text to bytes
            const bytes = new TextEncoder().encode(text);
            let result = '';
            let bits = 0;
            let value = 0;
            
            for (let i = 0; i < bytes.length; i++) {
                value = (value << 8) | bytes[i];
                bits += 8;
                
                while (bits >= 5) {
                    bits -= 5;
                    result += this.alphabet[(value >> bits) & 0x1F];
                }
            }
            
            // Handle remaining bits
            if (bits > 0) {
                result += this.alphabet[(value << (5 - bits)) & 0x1F];
            }
            
            // Add padding
            while (result.length % 8 !== 0) {
                result += '=';
            }
            
            return result;
        },
        preview: function(text: string): string {
            if (!text) return '[base32]';
            const full = this.func(text);
            return full.substring(0, 16) + (full.length > 16 ? '...' : '');
        },
        reverse: function(text: string): string {
            if (!text) return '';
            
            // Remove padding and whitespace
            text = text.replace(/\s+/g, '').replace(/=+$/, '');
            
            if (text.length === 0) return '';
            
            // Create reverse map
            const revMap: Record<string, string> = {};
            for (let i = 0; i < this.alphabet.length; i++) {
                revMap[this.alphabet[i]] = i;
            }
            
            const bytes = [];
            let bits = 0;
            let value = 0;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i].toUpperCase();
                if (revMap[char] === undefined) continue; // Skip invalid characters
                
                value = (value << 5) | revMap[char];
                bits += 5;
                
                while (bits >= 8) {
                    bits -= 8;
                    bytes.push((value >> bits) & 0xFF);
                }
            }
            
            // Use TextDecoder to properly handle UTF-8 multi-byte characters
            return new TextDecoder().decode(new Uint8Array(bytes));
        }

});