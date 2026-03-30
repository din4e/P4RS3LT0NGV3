// @ts-nocheck
// vaporwave transform
import { BaseTransformer } from '../BaseTransformer';

export const vaporwave = new BaseTransformer({

        name: 'Vaporwave',
    priority: 85,
    func: function(text: string): string {
            return [...text].join(' ');
        },
        preview: function(text: string): string {
            if (!text) return '[vaporwave]';
            return [...text.slice(0, 3)].join(' ') + '...';
        },
        reverse: function(text: string): string {
            // Remove single spaces between characters, but preserve word boundaries (double+ spaces)
            // Replace double spaces with a marker, remove single spaces, restore markers
            return text.replace(/  +/g, '\x00').replace(/ /g, '').replace(/\x00/g, ' ');
        }

});