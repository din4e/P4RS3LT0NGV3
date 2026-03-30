// @ts-nocheck
// baconian transform
import { BaseTransformer } from '../BaseTransformer';

export const baconian = new BaseTransformer({

        name: 'Baconian Cipher',
    priority: 60,
    table: (function(){
            const map = {};
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let i=0;i<26;i++) {
                const code = i.toString(2).padStart(5,'0').replace(/0/g,'A').replace(/1/g,'B');
                map[alphabet[i]] = code;
            }
            return map;
        })(),
        func: function(text: string): string {
            return [...text.toUpperCase()].map(ch => {
                if (this.table[ch]) return this.table[ch];
                if (/[\s]/.test(ch)) return '/';
                return ch;
            }).join(' ');
        },
        preview: function(text: string): string {
            if (!text) return 'AAAAA AABBA ...';
            return this.func((text || 'AB').slice(0,2));
        },
        reverse: function(text: string): string {
            const rev = {};
            Object.keys(this.table).forEach(k => rev[this.table[k]] = k);
            const tokens = text.trim().split(/\s+/);
            return tokens.map(tok => {
                if (tok === '/') return ' ';
                const clean = tok.replace(/[^AB]/g,'');
                if (clean.length === 5 && rev[clean]) return rev[clean];
                return tok;
            }).join('');
        }

});