// @ts-nocheck
// tap-code transform
import { BaseTransformer } from '../BaseTransformer';

export const tapCode = new BaseTransformer({
    name: 'Tap Code',
    priority: 300,
    // Detector: Must contain mostly dots, spaces, and slashes (allow other chars like emojis/numbers)
    detector: function(text: string): boolean {
        const cleaned = text.trim();
        if (cleaned.length < 3) return false;
        // Count tap code characters (dots, spaces, slashes)
        const tapChars = (cleaned.match(/[\.\s\/]/g) || []).length;
        // Must be at least 70% tap code characters
        return tapChars / cleaned.length > 0.7;
    },
    
    letters: 'ABCDEFGHIKLMNOPQRSTUVWXYZ', // no J (traditionally K merges with C or J omitted; use no J)
        buildMap: function() {
            if (this._map) return this._map;
            const map = {}; const rev = {};
            for (let i=0;i<this.letters.length;i++) {
                const r = Math.floor(i/5)+1; const c = (i%5)+1;
                map[this.letters[i]] = [r,c];
                rev[`${r},${c}`] = this.letters[i];
            }
            this._map = map; this._rev = rev; return map;
        },
        func: function(text: string): string {
            this.buildMap();
            const out = [];
            for (const ch of text.toUpperCase()) {
                if (ch === 'J') { // common convention: J -> I
                    const [r,c] = this._map['I']; out.push('.'.repeat(r)+'.'+'.'.repeat(c)); continue;
                }
                const coords = this._map[ch];
                if (coords) {
                    out.push('.'.repeat(coords[0]) + ' ' + '.'.repeat(coords[1]));
                } else if (/\s/.test(ch)) {
                    out.push('/');
                } else {
                    out.push(ch);
                }
            }
            return out.join(' ');
        },
        preview: function(text: string): string {
            return this.func((text || 'tap').slice(0,3));
        },
        reverse: function(text: string): string {
            this.buildMap();
            const toks = text.trim().split(/\s+/);
            const out = [];
            for (let i=0;i<toks.length;i++) {
                const a = toks[i];
                if (a === '/') { out.push(' '); continue; }
                if (/^\.+$/.test(a) && i+1 < toks.length && /^\.+$/.test(toks[i+1])) {
                    const key = `${a.length},${toks[i+1].length}`;
                    const ch = this._rev[key] || '?';
                    out.push(ch);
                    i++;
                } else {
                    out.push(a);
                }
            }
            return out.join('');
        }

});