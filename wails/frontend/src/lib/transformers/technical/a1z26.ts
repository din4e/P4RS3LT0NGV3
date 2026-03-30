// @ts-nocheck
// a1z26 transform
import { BaseTransformer } from '../BaseTransformer';

export const a1z26 = new BaseTransformer({
    name: 'A1Z26',
    priority: 275,
    // Detector: Check for A1Z26 pattern (numbers 1-26 separated by hyphens, words by spaces)
    detector: function(text: string): boolean {
        const cleaned = text.trim();
        if (cleaned.length < 3) return false;
        
        // Must contain only digits, hyphens, and spaces
        if (!/^[0-9\-\s]+$/.test(cleaned)) return false;
        
        // Check if numbers are in valid A1Z26 range (1-26)
        const numbers = cleaned.split(/[-\s]+/).filter(n => n.length > 0);
        if (numbers.length === 0) return false;
        
        // At least 50% of numbers should be in 1-26 range (allows some flexibility)
        const validCount = numbers.filter(n => {
            const num = parseInt(n, 10);
            return !isNaN(num) && num >= 1 && num <= 26;
        }).length;
        
        return validCount / numbers.length >= 0.5;
    },
    
    func: function(text: string): string {
            // Encode letters as numbers with hyphens, strip everything else (standard A1Z26)
            const letters = text.replace(/[^A-Za-z]/g, '');
            if (!letters) return '';
            return letters.split('').map(c => {
                const n = (c.toUpperCase().charCodeAt(0) - 64);
                return String(n);
            }).join('-');
        },
        preview: function(text: string): string {
            if (!text) return '[1-26]';
            const full = this.func(text);
            return full.substring(0, 20) + (full.length > 20 ? '...' : '');
        },
        reverse: function(text: string): string {
            // Decode numbers back to letters (standard A1Z26: strips spaces)
            return text.split(/[-\s,.\|\/]+/).filter(tok => tok).map(tok => {
                const n = parseInt(tok, 10);
                if (n >= 1 && n <= 26) {
                    return String.fromCharCode(64 + n).toLowerCase();
                }
                return '';
            }).join('');
        }

});