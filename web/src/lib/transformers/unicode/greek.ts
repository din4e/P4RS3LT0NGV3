// @ts-nocheck
// greek transform
import { BaseTransformer } from '../BaseTransformer';

export const greek = new BaseTransformer({
    name: 'Greek Letters',
    priority: 100,
    // Detector: Look for Greek alphabet characters
    detector: function(text: string): boolean {
        // Check if text contains Greek letters (α-ω, Α-Ω range)
        return /[α-ωΑ-Ωϐϑξ]/u.test(text);
    },
        map: {
            // Fixed ambiguous mappings: c→ξ (was χ), v→ϐ (was ς), x→χ stays
            'a': 'α', 'b': 'β', 'c': 'ξ', 'd': 'δ', 'e': 'ε', 'f': 'φ', 'g': 'γ', 'h': 'η',
            'i': 'ι', 'j': 'ϑ', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν', 'o': 'ο', 'p': 'π',
            'q': 'θ', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'v': 'ϐ', 'w': 'ω', 'x': 'χ',
            'y': 'ψ', 'z': 'ζ',
            'A': 'Α', 'B': 'Β', 'C': 'Ξ', 'D': 'Δ', 'E': 'Ε', 'F': 'Φ', 'G': 'Γ', 'H': 'Η',
            'I': 'Ι', 'J': 'Θ', 'K': 'Κ', 'L': 'Λ', 'M': 'Μ', 'N': 'Ν', 'O': 'Ο', 'P': 'Π',
            'Q': 'Θ', 'R': 'Ρ', 'S': 'Σ', 'T': 'Τ', 'U': 'Υ', 'V': 'ς', 'W': 'Ω', 'X': 'Χ',
            'Y': 'Ψ', 'Z': 'Ζ'
        },
        func: function(text: string): string {
            return text.split('').map(char => this.map![char] || char).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[greek]';
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