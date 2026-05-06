// @ts-nocheck
// remove html tags transform
import { BaseTransformer } from '../BaseTransformer';

export const removeHtmlTags = new BaseTransformer({
    name: 'Remove HTML Tags',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/<[^>]*>/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - HTML tags are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-html]';
        return this.func(text.slice(0, 15));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if text contains HTML tags
        return /<[^>]+>/.test(text);
    }
});

