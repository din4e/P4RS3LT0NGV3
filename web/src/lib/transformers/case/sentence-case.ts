// @ts-nocheck
// sentence-case transform
import { BaseTransformer } from '../BaseTransformer';

export const sentenceCase = new BaseTransformer({

        name: 'Sentence Case',
    priority: 150,  // Higher priority to detect before Base64
    func: function(text: string): string {
            if (!text) return '';
            const lower = text.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        },
        preview: function(text: string): string {
            if (!text) return '[Sentence]';
            return this.func(text.slice(0, 12)) + (text.length > 12 ? '...' : '');
        }

});