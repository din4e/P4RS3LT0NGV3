// @ts-nocheck
// title-case transform
import { BaseTransformer } from '../BaseTransformer';

export const titleCase = new BaseTransformer({

        name: 'Title Case',
    priority: 150,  // Higher priority to detect before Base64
    func: function(text: string): string {
            return text.replace(/pattern/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        },
        preview: function(text: string): string {
            if (!text) return '[Title Case]';
            return this.func(text.slice(0, 12)) + (text.length > 12 ? '...' : '');
        }

});