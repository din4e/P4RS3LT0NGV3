// @ts-nocheck
// subscript transform
import { BaseTransformer } from '../BaseTransformer';

export const subscript = new BaseTransformer({

        name: 'Subscript',
    priority: 85,
    map: {
            '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
            'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'
        },
        func: function(text: string): string {
            return [...text].map(c => this.map![c] || c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[sub]';
            return this.func(text.slice(0, 4)) + (text.length > 4 ? '...' : '');
        },
        reverse: function(text: string): string {
            const revMap: Record<string, string> = {};
            for (const [k, v] of Object.entries(this.map!)) revMap[v] = k;
            return [...text].map(c => revMap[c] || c).join('');
        }

});