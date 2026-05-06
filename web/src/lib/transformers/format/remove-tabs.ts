// @ts-nocheck
// remove tabs transform
import { BaseTransformer } from '../BaseTransformer';

export const removeTabs = new BaseTransformer({
    name: 'Remove Tabs',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/\t/g, ' ');
    },
    reverse: function(text: string): string {
        // Cannot reverse - tab positions are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-tabs]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Hard to detect
        return false;
    }
});

