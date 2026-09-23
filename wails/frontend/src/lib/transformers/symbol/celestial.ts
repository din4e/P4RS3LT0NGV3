// @ts-nocheck
// @generated from data/alphabets — do not edit by hand
import { BaseTransformer } from '../BaseTransformer';

export const celestial = new BaseTransformer({
    name: 'Celestial Alphabet',
    priority: 100,
    category: 'symbol',
    description: 'Agrippa\'s celestial / angelic symbol alphabet',
    map: {
        'A': '☉',
        'B': '☽',
        'C': '☿',
        'D': '♀',
        'E': '♂',
        'F': '♃',
        'G': '♄',
        'H': '♅',
        'I': '♆',
        'J': '♇',
        'K': '☊',
        'L': '☋',
        'M': '⚳',
        'N': '⚴',
        'O': '⚵',
        'P': '⚶',
        'Q': '⚷',
        'R': '⚸',
        'S': '⚹',
        'T': '⚺',
        'U': '⚻',
        'V': '⚼',
        'W': '⚽',
        'X': '⚾',
        'Y': '⛢',
        'Z': '⛣'
    },
    func: function(text: string): string {
        return [...text].map(c => this.map![c] || this.map![c.toUpperCase()] || c).join('');
    },
    preview: function(text: string): string {
        if (!text) return '[celestial]';
        return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
    },
    detector: function(text: string): boolean {
        return new RegExp('[☉☽☿♀♂♃♄♅♆♇☊☋]', 'u').test(text);
    }
});
