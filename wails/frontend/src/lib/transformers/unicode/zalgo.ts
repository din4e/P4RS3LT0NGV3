// @ts-nocheck
// zalgo transform
import { BaseTransformer } from '../BaseTransformer';

export const zalgo = new BaseTransformer({

        name: 'Zalgo',
    priority: 85,
    marks: [
            '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', '\u0308',
            '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F', '\u0310', '\u0311',
            '\u0312', '\u0313', '\u0314', '\u0315', '\u031A', '\u031B', '\u033D', '\u033E', '\u033F'
        ],
        func: function(text: string): string {
            return [...text].map(c => {
                let result = c;
                for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                    result += this.marks[Math.floor(Math.random() * this.marks.length)];
                }
                return result;
            }).join('');
        },
        preview: function(text: string): string {
            return this.func(text);
        },
        reverse: function(text: string): string {
            // Remove all combining diacritical marks (Unicode range 0300-036F)
            // This includes the marks used by Zalgo and many others
            return text.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
        },
        // Detector: Check for Zalgo text (excessive combining marks)
        detector: function(text: string): boolean {
            // Zalgo text has many combining diacritical marks
            const combiningMarksRegex = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;
            const matches = text.match(combiningMarksRegex) || [];
            // Threshold: at least 4 combining marks to distinguish from normal accented text
            return matches.length > 3;
        }

});