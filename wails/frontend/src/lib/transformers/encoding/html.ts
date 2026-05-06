// @ts-nocheck
// html transform
import { BaseTransformer } from '../BaseTransformer';

export const html = new BaseTransformer({
    name: 'HTML Entities',
    priority: 40,
    // Detector: Look for &...; pattern (HTML entities)
    detector: function(text: string): boolean {
        return text.includes('&') && text.includes(';') && /&[a-zA-Z0-9#]+;/.test(text);
    },
    
    func: function(text: string): string {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        preview: function(text: string): string {
            return this.func(text);
        },
        reverse: function(text: string): string {
            return text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'');
        }

});