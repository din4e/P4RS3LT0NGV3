// @ts-nocheck
// kebab-case transform
import { BaseTransformer } from '../BaseTransformer';

export const kebabCase = new BaseTransformer({

        name: 'kebab-case',
    priority: 280,
    func: function(text: string): string {
            return text.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean).map(s => s.toLowerCase()).join('-');
        },
        preview: function(text: string): string {
            if (!text) return '[kebab]';
            return this.func(text);
        },
        // Detector: Look for lowercase alphanumeric words separated by hyphens
        detector: function(text: string): boolean {
            const cleaned = text.trim();
            // Must have at least one hyphen and only lowercase letters, numbers, and hyphens
            if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(cleaned)) return false;
            
            // Exclude A1Z26 (all numbers 1-26)
            const parts = cleaned.split('-');
            const allValidA1Z26 = parts.every(p => {
                const num = parseInt(p, 10);
                return !isNaN(num) && num >= 1 && num <= 26;
            });
            if (allValidA1Z26 && parts.length > 1) return false;  // Likely A1Z26
            
            // Must contain at least some letters (not just numbers)
            return /[a-z]/.test(cleaned);
        },
        // Reverse: Replace hyphens with spaces
        reverse: function(text: string): string {
            return text.replace(/-/g, ' ');
        }

});