// @ts-nocheck
// nato transform
import { BaseTransformer } from '../BaseTransformer';

export const nato = new BaseTransformer({

        name: 'NATO Phonetic',
    priority: 300,
    map: {
            'a': 'Alpha', 'b': 'Bravo', 'c': 'Charlie', 'd': 'Delta', 'e': 'Echo',
            'f': 'Foxtrot', 'g': 'Golf', 'h': 'Hotel', 'i': 'India', 'j': 'Juliett',
            'k': 'Kilo', 'l': 'Lima', 'm': 'Mike', 'n': 'November', 'o': 'Oscar',
            'p': 'Papa', 'q': 'Quebec', 'r': 'Romeo', 's': 'Sierra', 't': 'Tango',
            'u': 'Uniform', 'v': 'Victor', 'w': 'Whiskey', 'x': 'X-ray', 'y': 'Yankee', 'z': 'Zulu',
            '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
            '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
        },
        func: function(text: string): string {
            // Use | to mark word boundaries
            return [...text.toLowerCase()].map(c => {
                if (c === ' ') return '|';
                return this.map![c] || c;
            }).join(' ');
        },
        preview: function(text: string): string {
            if (!text) return '[quenya]';
            return this.func(text.slice(0, 3)) + '...';
        },
        // Create reverse map for decoding
        reverseMap: function() {
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value.toLowerCase()] = key;
            }
            return revMap;
        },
        reverse: function(text: string): string {
            const revMap = (this as any).reverseMap();
            return text.split(/\s+/).map(word => {
                if (word === '|') return ' ';
                return revMap[word.toLowerCase()] || word;
            }).join('');
        }

});