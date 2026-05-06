// @ts-nocheck
// aurebesh transform
import { BaseTransformer } from '../BaseTransformer';

export const aurebesh = new BaseTransformer({

        name: 'Aurebesh (Star Wars)',
    priority: 100,
    map: {
            'a': 'Aurek', 'b': 'Besh', 'c': 'Cresh', 'd': 'Dorn', 'e': 'Esk', 'f': 'Forn', 'g': 'Grek', 'h': 'Herf', 'i': 'Isk',
            'j': 'Jenth', 'k': 'Krill', 'l': 'Leth', 'm': 'Mern', 'n': 'Nern', 'o': 'Osk', 'p': 'Peth', 'q': 'Qek', 'r': 'Resh',
            's': 'Senth', 't': 'Trill', 'u': 'Usk', 'v': 'Vev', 'w': 'Wesk', 'x': 'Xesh', 'y': 'Yirt', 'z': 'Zerek',
            'A': 'AUREK', 'B': 'BESH', 'C': 'CRESH', 'D': 'DORN', 'E': 'ESK', 'F': 'FORN', 'G': 'GREK', 'H': 'HERF', 'I': 'ISK',
            'J': 'JENTH', 'K': 'KRILL', 'L': 'LETH', 'M': 'MERN', 'N': 'NERN', 'O': 'OSK', 'P': 'PETH', 'Q': 'QEK', 'R': 'RESH',
            'S': 'SENTH', 'T': 'TRILL', 'U': 'USK', 'V': 'VEV', 'W': 'WESK', 'X': 'XESH', 'Y': 'YIRT', 'Z': 'ZEREK'
        },
        func: function(text: string): string {
            return [...text.toLowerCase()].map(c => this.map![c] || c).join(' ');
        },
        reverse: function(text: string): string {
            const revMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(this.map!)) {
                revMap[value.toLowerCase()] = key;
            }
            return text.split(/\s+/).map(word => revMap[word.toLowerCase()] || word).join('');
        },
        // Detector: Check for Aurebesh words
        detector: function(text: string): boolean {
            // Aurebesh uses specific word patterns like "Aurek", "Besh", "Cresh", etc.
            const aurebeshWords = ['aurek', 'besh', 'cresh', 'dorn', 'esk', 'forn', 'grek', 'herf', 'isk',
                                   'jenth', 'krill', 'leth', 'mern', 'nern', 'osk', 'peth', 'qek', 'resh',
                                   'senth', 'trill', 'usk', 'vev', 'wesk', 'xesh', 'yirt', 'zerek'];
            const lowerText = text.toLowerCase();
            // Check if at least 2 Aurebesh words are present
            const matches = aurebeshWords.filter(word => lowerText.includes(word));
            return matches.length >= 2;
        }

});