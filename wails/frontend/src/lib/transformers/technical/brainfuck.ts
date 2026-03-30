// @ts-nocheck
// brainfuck transform
import { BaseTransformer } from '../BaseTransformer';

export const brainfuck = new BaseTransformer({
    name: 'Brainfuck',
    priority: 300,
    // Detector: Only Brainfuck commands (8 characters)
    detector: function(text: string): boolean {
        const cleaned = text.trim();
        return cleaned.length >= 10 && /^[><+\-.,\[\]\s]+$/.test(cleaned);
    },
    
    // Simple character to Brainfuck encoding
    encode: function(char) {
            const code = char.charCodeAt(0);
            return '+'.repeat(code) + '.';
        },
        func: function(text: string): string {
            // Convert each character to Brainfuck
            // Use >[-] to move to next cell and clear it (stay on the new cell)
            return [...text].map(c => this.encode(c)).join('>[-]');
        },
        preview: function(text: string): string {
            return '[brainfuck]';
        },
        // Brainfuck interpreter for decoding
        reverse: function(code) {
            const cells = new Array(30000).fill(0);
            let pointer = 0;
            let output = '';
            let codePointer = 0;
            let iterations = 0;
            const maxIterations = 100000; // Prevent infinite loops
            
            while (codePointer < code.length && iterations < maxIterations) {
                iterations++;
                const instruction = code[codePointer];
                
                switch (instruction) {
                    case '>':
                        pointer++;
                        if (pointer >= cells.length) pointer = 0;
                        break;
                    case '<':
                        pointer--;
                        if (pointer < 0) pointer = cells.length - 1;
                        break;
                    case '+':
                        cells[pointer] = (cells[pointer] + 1) % 256;
                        break;
                    case '-':
                        cells[pointer] = (cells[pointer] - 1 + 256) % 256;
                        break;
                    case '.':
                        output += String.fromCharCode(cells[pointer]);
                        break;
                    case '[':
                        if (cells[pointer] === 0) {
                            let depth = 1;
                            while (depth > 0) {
                                codePointer++;
                                if (code[codePointer] === '[') depth++;
                                if (code[codePointer] === ']') depth--;
                            }
                        }
                        break;
                    case ']':
                        if (cells[pointer] !== 0) {
                            let depth = 1;
                            while (depth > 0) {
                                codePointer--;
                                if (code[codePointer] === ']') depth++;
                                if (code[codePointer] === '[') depth--;
                            }
                        }
                        break;
                    case ',':
                        // Input not supported in web context
                        cells[pointer] = 0;
                        break;
                }
                codePointer++;
            }
            
            return output || null;
        }

});