// @ts-nocheck
// base64url transform
import { BaseTransformer } from '../BaseTransformer';

export const base64url = new BaseTransformer({
    name: 'Base64 URL',
    priority: 270,
    // Detector: Only Base64 URL characters (A-Z, a-z, 0-9, -, _, =)
    detector: function(text: string): boolean {
        const cleaned = text.trim().replace(/\s/g, '');
        return cleaned.length >= 4 && /^[A-Za-z0-9\-_=]+$/.test(cleaned);
    },
    
    func: function(text: string): string {
            if (!text) return '';
            try {
                // Properly encode UTF-8 text (including emojis) to Base64 URL
                const encoder = new TextEncoder();
                const bytes = encoder.encode(text);
                let binaryString = '';
                for (let i = 0; i < bytes.length; i++) {
                    binaryString += String.fromCharCode(bytes[i]);
                }
                const std = btoa(binaryString);
                return std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
            } catch (e) {
                return '[Invalid input]';
            }
        },
        preview: function(text: string): string {
            if (!text) return '[b64url]';
            const full = this.func(text);
            return full.substring(0, 12) + (full.length > 12 ? '...' : '');
        },
        reverse: function(text: string): string {
            if (!text) return '';
            let std = text.replace(/-/g, '+').replace(/_/g, '/');
            // pad
            while (std.length % 4 !== 0) std += '=';
            try {
                // Properly decode Base64 URL to UTF-8 text (including emojis)
                const binaryString = atob(std);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(bytes);
            } catch (e) {
                return text;
            }
        }

});