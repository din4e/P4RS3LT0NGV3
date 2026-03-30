// @ts-nocheck
// small-caps transform
import { BaseTransformer } from '../BaseTransformer';

export const smallCaps = new BaseTransformer({

        name: 'Small Caps',
    priority: 85,
    map: {
            'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
            'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
            's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join('');
        },
        // Detector: Check for small caps Unicode characters
        detector: function(text: string): boolean {
            // Small caps use various Unicode ranges (U+1D00-U+1D7F phonetic extensions, U+A730-U+A7FF Latin Extended-D)
            return /[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀᴛᴜᴠᴡʏᴢ]/.test(text);
        }

});