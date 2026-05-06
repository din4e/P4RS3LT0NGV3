// @ts-nocheck
// roman-numerals transform
import { BaseTransformer } from '../BaseTransformer';

export const romanNumerals = new BaseTransformer({

        name: 'Roman Numerals',
    priority: 70,
    numerals: [
            ['M',1000],['CM',900],['D',500],['CD',400],
            ['C',100],['XC',90],['L',50],['XL',40],
            ['X',10],['IX',9],['V',5],['IV',4],['I',1]
        ],
        func: function(text: string): string {
            return text.replace(/\b\d+\b/g, m => {
                let num = parseInt(m,10);
                if (num <= 0 || num > 3999 || isNaN(num)) return m;
                let out = '';
                for (const [sym,val] of this.numerals) {
                    while (num >= val) { out += sym; num -= val; }
                }
                return out;
            });
        },
        preview: function(text: string): string {
            return this.func(text || '2024');
        },
        reverse: function(text: string): string {
            // Greedy parse roman numerals to digits
            const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
            const tokenize = s => s.match(/[IVXLCDM]+|[^IVXLCDM]+/gi) || [s];
            return tokenize(text).map(tok => {
                if (!/^[IVXLCDM]+$/i.test(tok)) return tok;
                const s = tok.toUpperCase();
                let total = 0;
                for (let i=0;i<s.length;i++) {
                    const v = map[s[i]] || 0;
                    const n = map[s[i+1]] || 0;
                    total += v < n ? -v : v;
                }
                return String(total);
            }).join('');
        }

});