// Deafblind Tactile SignWriting transform
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'Tactile SignWriting',
    priority: 0,
    canDecode: false,
    description: 'Deafblind tactile fingerspelling approximation in SignWriting (ISWA 2010). Two-hand layers per letter.',

    tactileMap: {
        'A': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈷷𪪝𪪩񈵆𪪞񉅄'],
        'B': ['񉄌𪪝𪪩񉄶𪪞', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'C': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈷜𪪝𪪩񈵆𪪟𪪧񉅂񈶻𪪩'],
        'D': ['񉄌𪪝𪪩񈻢𪪟𪪡', '񈄀𪪝𪪩񈵆𪪞񈵆𪪞𪪨񉅄'],
        'E': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈄀𪪝𪪩񈵆𪪞񉅄'],
        'F': ['񉄌𪪝𪪩񈴕𪪟𪪡', '񈄀𪪝𪪩񈵆𪪞𪪩񉅄'],
        'G': ['񉄌𪪝𪪩񉄃𪪞𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'H': ['񉄌𪪝𪪩񉄌𪪟𪪡', '񉄌𪪝𪪩񉅂񉅦𪪧'],
        'I': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈷆𪪝𪪧񈵆𪪞񉅄'],
        'J': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񉄌𪪝𪪩񈷆𪪝𪪧񈵆𪪞񉅂񉅦𪪣񈵆𪪟񉅸𪪧'],
        'K': ['񉄌𪪝𪪩񈴆𪪝𪪡', '񈄀𪪝𪪩񈵆𪪞𪪩񉅄'],
        'L': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'M': ['񉄌𪪝𪪩񈵌𪪟𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'N': ['񉄌𪪝𪪩񈴕𪪟𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'O': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈶮𪪝𪪩񈵆𪪞񉅄'],
        'P': ['񉄌𪪝𪪩񈷱𪪟𪪡', '񈄀𪪝𪪩񈵆𪪞𪪢񉅂񉅗'],
        'Q': ['񉄌𪪝𪪩񈴆𪪟𪪡', '񈷷𪪝𪪩񉄈񉆾𪪡'],
        'R': ['񉄌𪪝𪪩񈴆𪪞𪪡', '񉄌𪪝𪪩񈵆𪪟𪪫񉅄'],
        'S': ['񉄌𪪝𪪩񈴆𪪟𪪡', '񈶒𪪝𪪩񉄈񉆾𪪡'],
        'T': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񉄌𪪝𪪩񈵆𪪟𪪫񉅄'],
        'U': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈶒𪪝𪪩񈵆𪪞񉅄'],
        'V': ['񉄌𪪝𪪩񈴎𪪟𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄'],
        'W': ['񉄌𪪝𪪩񉄎𪪟𪪡', '񈶝𪪝𪪩񈵆𪪟𪪡񉄈'],
        'X': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈄀𪪝𪪩񈵆𪪞𪪩񉅄'],
        'Y': ['񉄌𪪝𪪩񈄀𪪟𪪡', '񈷷𪪝𪪩񈵆𪪟𪪮'],
        'Z': ['񉄌𪪝𪪩񉄚𪪞𪪡', '񉄌𪪝𪪩񈵆𪪟񉅄']
    },

    func: function(text) {
        var upper = text.toUpperCase();
        var blocks = [];
        for (var i = 0; i < upper.length; i++) {
            var ch = upper[i];
            if (ch === ' ') {
                blocks.push(' \n ');
                continue;
            }
            var sign = this.tactileMap[ch];
            if (sign) {
                blocks.push(sign[0] + '\n' + sign[1]);
            }
        }
        return blocks.join('\n\n');
    },

    preview: function(text) {
        if (!text) return '[Tactile SignWriting]';
        return this.func(text.slice(0, 3));
    }
});
