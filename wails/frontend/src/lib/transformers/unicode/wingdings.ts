// @ts-nocheck
// wingdings transform
import { BaseTransformer } from '../BaseTransformer';

export const wingdings = new BaseTransformer({

        name: 'Wingdings',
    priority: 100,
    map: {
            'a': '♋', 'b': '♌', 'c': '♍', 'd': '♎', 'e': '♏', 'f': '♐', 'g': '♑', 'h': '♒',
            'i': '♓', 'j': '⛎', 'k': '☀', 'l': '☁', 'm': '☂', 'n': '☃', 'o': '☄', 'p': '★',
            'q': '☆', 'r': '☇', 's': '☈', 't': '☉', 'u': '☊', 'v': '☋', 'w': '☌', 'x': '☍',
            'y': '☎', 'z': '☏',
            'A': '♠', 'B': '♡', 'C': '♢', 'D': '♣', 'E': '♤', 'F': '♥', 'G': '♦', 'H': '♧',
            'I': '♨', 'J': '♩', 'K': '♪', 'L': '♫', 'M': '♬', 'N': '♭', 'O': '♮', 'P': '♯',
            'Q': '✁', 'R': '✂', 'S': '✃', 'T': '✄', 'U': '✆', 'V': '✇', 'W': '✈', 'X': '✉',
            'Y': '✌', 'Z': '✍',
            '0': '✓', '1': '✔', '2': '✕', '3': '✖', '4': '✗', '5': '✘', '6': '✙', '7': '✚',
            '8': '✛', '9': '✜',
            '.': '✠', ',': '✡', '?': '✢', '!': '✣', '@': '✤', '#': '✥', '$': '✦', '%': '✧',
            '^': '✩', '&': '✪', '*': '✫', '(': '✬', ')': '✭', '-': '✮', '_': '✯', '=': '✰',
            '+': '✱', '[': '✲', ']': '✳', '{': '✴', '}': '✵', '|': '✶', '\\': '✷', ';': '✸',
            ':': '✹', '"': '✺', '\'': '✻', '<': '✼', '>': '✽', '/': '✾', '~': '✿', '`': '❀'
        },
        func: function(text: string): string {
            return text.split('').map(char => this.map![char] || char).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[wingdings]';
            return this.func(text.slice(0, 10));
        },
        reverseMap: function() {
            if (!this._reverseMap) {
                this._reverseMap = {};
                for (let key in this.map) {
                    this._reverseMap[this.map![key]] = key;
                }
            }
            return this._reverseMap;
        },
        reverse: function(text: string): string {
            const revMap = (this as any).reverseMap();
            return text.split('').map(char => revMap[char] || char).join('');
        }

});