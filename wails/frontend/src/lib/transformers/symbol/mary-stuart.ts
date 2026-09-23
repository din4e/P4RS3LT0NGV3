// @ts-nocheck
// @generated from data/alphabets — do not edit by hand
import { BaseTransformer } from '../BaseTransformer';

export const maryStuart = new BaseTransformer({
    name: 'Mary Stuart Cipher',
    priority: 100,
    category: 'symbol',
    description: 'Mary Queen of Scots nomenclator-style symbols',
    map: {
        'A': '❶',
        'B': '❷',
        'C': '❸',
        'D': '❹',
        'E': '❺',
        'F': '❻',
        'G': '❼',
        'H': '❽',
        'I': '❾',
        'J': '❿',
        'K': '➀',
        'L': '➁',
        'M': '➂',
        'N': '➃',
        'O': '➄',
        'P': '➅',
        'Q': '➆',
        'R': '➇',
        'S': '➈',
        'T': '➉',
        'U': '➊',
        'V': '➋',
        'W': '➌',
        'X': '➍',
        'Y': '➎',
        'Z': '➏'
    },
    func: function(text: string): string {
        return [...text].map(c => this.map![c] || this.map![c.toUpperCase()] || c).join('');
    },
    preview: function(text: string): string {
        if (!text) return '[mary-stuart]';
        return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
    },
    detector: function(text: string): boolean {
        return new RegExp('[❶❷❸❹❺❻❼❽❾]', 'u').test(text);
    }
});
