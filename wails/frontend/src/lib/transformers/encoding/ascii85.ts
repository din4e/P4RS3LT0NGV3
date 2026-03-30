// @ts-nocheck
// ascii85 transform
import { BaseTransformer } from '../BaseTransformer';

export const ascii85 = new BaseTransformer({
    name: 'ASCII85',
    priority: 290,
    // Detector: ASCII85 has distinctive <~ ~> wrapper
    detector: function(text: string): boolean {
        return text.startsWith('<~') && text.endsWith('~>');
    },
    
    func: function(text: string): string {
            // Simple ASCII85 encoding implementation
            // Use TextEncoder to properly handle multi-byte UTF-8 characters
            const bytes = new TextEncoder().encode(text);
            let result = '<~';
            let buffer = 0;
            let bufferLength = 0;
            
            for (let i = 0; i < bytes.length; i++) {
                buffer = (buffer << 8) | bytes[i];
                bufferLength += 8;
                
                if (bufferLength >= 32) {
                    let value = buffer >>> (bufferLength - 32);
                    buffer &= (1 << (bufferLength - 32)) - 1;
                    bufferLength -= 32;
                    
                    if (value === 0) {
                        result += 'z';
                    } else {
                        for (let j = 4; j >= 0; j--) {
                            const digit = (value / Math.pow(85, j)) % 85;
                            result += String.fromCharCode(digit + 33);
                        }
                    }
                }
            }
            
            // Handle remaining bits
            if (bufferLength > 0) {
                buffer <<= (32 - bufferLength);
                let value = buffer;
                const bytes = Math.ceil(bufferLength / 8);
                
                for (let j = 4; j >= (4 - bytes); j--) {
                    const digit = (value / Math.pow(85, j)) % 85;
                    result += String.fromCharCode(digit + 33);
                }
            }
            
            return result + '~>';
        },
        preview: function(text: string): string {
            if (!text) return '[ascii85]';
            const full = this.func(text);
            return full.substring(0, 16) + (full.length > 16 ? '...' : '');
        },
        reverse: function(text: string): string {
            // Check if it's a valid ASCII85 string
            if (!text.startsWith('<~') || !text.endsWith('~>')) {
                return text;
            }
            
            // Remove delimiters and whitespace
            text = text.substring(2, text.length - 2).replace(/\s+/g, '');
            
            const bytes = [];
            let i = 0;
            
            while (i < text.length) {
                // Handle 'z' special case (represents 4 zero bytes)
                if (text[i] === 'z') {
                    bytes.push(0, 0, 0, 0);
                    i++;
                    continue;
                }
                
                // Process a group of 5 characters
                if (i < text.length) {
                    let value = 0;
                    const groupSize = Math.min(5, text.length - i);
                    
                    // Convert the group to a 32-bit value
                    for (let j = 0; j < groupSize; j++) {
                        value = value * 85 + (text.charCodeAt(i + j) - 33);
                    }
                    
                    // Pad with 'u' (84) if needed for partial groups
                    for (let j = groupSize; j < 5; j++) {
                        value = value * 85 + 84;
                    }
                    
                    // Extract bytes from the value
                    // groupSize chars encodes (groupSize - 1) bytes
                    const bytesToWrite = groupSize - 1;
                    for (let j = 0; j < bytesToWrite; j++) {
                        bytes.push((value >>> ((3 - j) * 8)) & 0xFF);
                    }
                    
                    i += groupSize;
                } else {
                    break;
                }
            }
            
            // Use TextDecoder to properly handle UTF-8 multi-byte characters
            return new TextDecoder().decode(new Uint8Array(bytes));
        }

});