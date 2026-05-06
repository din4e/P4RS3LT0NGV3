// @ts-nocheck
// semaphore transform
import { BaseTransformer } from '../BaseTransformer';

export const semaphore = new BaseTransformer({
    name: 'Semaphore Flags',
    priority: 310,
    // Detector: Only uses 8 specific arrow emojis (most exclusive character set)
    detector: function(text: string): boolean {
        const cleaned = text.trim();
        return cleaned.length >= 2 && /^[⬆️↗️➡️↘️⬇️↙️⬅️↖️⬆↗➡↘⬇↙⬅↖\s\/]+$/u.test(cleaned);
    },
    
    // Positions 1..8 around the clock: 1=⬆️ 2=↗️ 3=➡️ 4=↘️ 5=⬇️ 6=↙️ 7=⬅️ 8=↖️
    arrows: ['','⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️'],
        // Standard semaphore mapping (J is special: 2-1)
        table: {
            'A':[1,2],'B':[1,3],'C':[1,4],'D':[1,5],'E':[1,6],'F':[1,7],'G':[1,8],
            'H':[2,3],'I':[2,4],'J':[2,1],
            'K':[2,5],'L':[2,6],'M':[2,7],'N':[2,8],
            'O':[3,4],'P':[3,5],'Q':[3,6],'R':[3,7],'S':[3,8],
            'T':[4,5],'U':[4,6],'V':[4,7],'W':[4,8],
            'X':[5,6],'Y':[5,7],'Z':[5,8]
        },
        encodePair: function(pair) { return this.arrows[pair[0]] + this.arrows[pair[1]]; },
        buildReverse: function() {
            if (this._rev) return this._rev;
            const rev = {};
            for (const [k, v] of Object.entries(this.table)) {
                rev[this.encodePair(v)] = k;
            }
            this._rev = rev; return rev;
        },
        func: function(text: string): string {
            return [...text].map(ch => {
                if (/\s/.test(ch)) return '/';
                const up = ch.toUpperCase();
                const pair = this.table[up];
                return pair ? this.encodePair(pair) : ch;
            }).join(' ');
        },
        preview: function(text: string): string {
            return this.func((text || 'flag').slice(0, 4));
        },
        reverse: function(text: string): string {
            const rev = this.buildReverse();
            const tokens = text.trim().split(/\s+/);
            return tokens.map(tok => {
                if (tok === '/') return ' ';
                // Some platforms add variation selectors; normalize by direct match first
                return rev[tok] || tok;
            }).join('');
        }

});