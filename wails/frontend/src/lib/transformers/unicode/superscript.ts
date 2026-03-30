// @ts-nocheck
// superscript transform
import { BaseTransformer } from '../BaseTransformer';

export const superscript = new BaseTransformer({

        name: 'Superscript',
    priority: 85,
    map: {
            '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
            'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','q':'ᵠ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
            'A':'ᴬ','B':'ᴮ','C':'ᶜ','D':'ᴰ','E':'ᴱ','F':'ᶠ','G':'ᴳ','H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','Q':'ᵠ','R':'ᴿ','S':'ˢ','T':'ᵀ','U':'ᵁ','V':'ⱽ','W':'ᵂ','X':'ˣ','Y':'ʸ','Z':'ᶻ'
        },
        func: function(text: string): string {
            return [...text].map(c => this.map![c] || c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[super]';
            return this.func(text.slice(0, 4)) + (text.length > 4 ? '...' : '');
        },
        reverse: function(text: string): string {
            const revMap: Record<string, string> = {};
            for (const [k, v] of Object.entries(this.map!)) revMap[v] = k;
            return [...text].map(c => revMap[c] || c).join('');
        }

});