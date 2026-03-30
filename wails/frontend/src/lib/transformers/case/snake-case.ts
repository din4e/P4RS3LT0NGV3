// @ts-nocheck
// snake-case transform
import { BaseTransformer } from '../BaseTransformer';

export const snakeCase = new BaseTransformer({

        name: 'snake_case',
    priority: 280,
    func: function(text: string): string {
            return text.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean).map(s => s.toLowerCase()).join('_');
        },
        preview: function(text: string): string {
            if (!text) return '[snake]';
            return this.func(text);
        },
        // Detector: Look for lowercase alphanumeric words separated by underscores
        detector: function(text: string): boolean {
            const cleaned = text.trim();
            // Must have at least one underscore and only lowercase letters, numbers, and underscores
            if (!/^[a-z0-9]+(_[a-z0-9]+)+$/.test(cleaned)) return false;
            
            // Must contain at least some letters (not just numbers)
            return /[a-z]/.test(cleaned);
        },
        // Reverse: Replace underscores with spaces
        reverse: function(text: string): string {
            return text.replace(/_/g, ' ');
        }

});