// @ts-nocheck
// rot18 transform
import { BaseTransformer } from '../BaseTransformer';

export const rot18 = new BaseTransformer({

        name: 'ROT18',
    priority: 60,
    func: function(text: string): string {
            const rot13 = c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCharCode(65 + ((code-65 + 13)%26));
                if (code >= 97 && code <= 122) return String.fromCharCode(97 + ((code-97 + 13)%26));
                return c;
            };
            const rot5 = c => {
                if (c >= '0' && c <= '9') return String.fromCharCode(48 + (((c.charCodeAt(0)-48)+5)%10));
                return c;
            };
            return [...text].map(c => rot5(rot13(c))).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[rot18]';
            return this.func(text.slice(0, 8)) + (text.length>8?'...':'');
        },
        reverse: function(text: string): string { return this.func(text); }

});