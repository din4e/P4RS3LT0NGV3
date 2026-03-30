// @ts-nocheck
// remove consonants transform
import { BaseTransformer } from '../BaseTransformer';

export const removeConsonants = new BaseTransformer({
    name: 'Remove Consonants',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - consonants are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[vowels-only]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // If text has only vowels/spaces/punctuation, might have consonants removed
        const cleaned = text.replace(/[\s.,!?;:'"()\-&0-9]/g, '');
        return cleaned.length > 0 && !/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]/i.test(cleaned);
    }
});

