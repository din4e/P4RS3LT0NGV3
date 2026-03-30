// @ts-nocheck
// cyrillic-stylized transform
import { BaseTransformer } from '../BaseTransformer';

export const cyrillicStylized = new BaseTransformer({

        name: 'Cyrillic Stylized',
    priority: 100,
    map: {
            'A':'А','B':'В','C':'С','E':'Е','H':'Н','K':'К','M':'М','O':'О','P':'Р','T':'Т','X':'Х','Y':'У',
            'a':'а','e':'е','o':'о','p':'р','c':'с','y':'у','x':'х','k':'к','h':'һ','m':'м','t':'т','b':'Ь'
        },
        func: function(text: string): string {
            return [...text].map(c => this.map![c] || c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[cyrillic]';
            return this.func(text.slice(0, 8)) + (text.length > 8 ? '...' : '');
        },
        reverse: function(text: string): string {
            const rev = {};
            for (const [k, v] of Object.entries(this.map!)) rev[v] = k;
            return [...text].map(c => rev[c] || c).join('');
        }

});