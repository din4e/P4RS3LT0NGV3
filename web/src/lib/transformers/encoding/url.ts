// @ts-nocheck
// url transform
import { BaseTransformer } from '../BaseTransformer';

export const url = new BaseTransformer({
    name: 'URL Encode',
    priority: 40,
    // Detector: Look for %XX pattern (URL encoding)
    detector: function(text: string): boolean {
        return text.includes('%') && /%[0-9A-Fa-f]{2}/.test(text);
    },
    
    func: function(text: string): string {
            try {
                return encodeURIComponent(text);
            } catch (e) {
                // Catch malformed Unicode or unpaired surrogates
                return '[Invalid input]';
            }
        },
        preview: function(text: string): string {
            return this.func(text);
        },
        reverse: function(text: string): string {
            try {
                return decodeURIComponent(text);
            } catch (e) {
                return text;
            }
        }

});