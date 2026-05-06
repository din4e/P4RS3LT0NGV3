// @ts-nocheck
// emoji-speak transform
import { BaseTransformer } from '../BaseTransformer';

export const emojiSpeak = new BaseTransformer({

        name: 'Emoji Speak',
    priority: 70,
    digitMap: {'0':'0️⃣','1':'1️⃣','2':'2️⃣','3':'3️⃣','4':'4️⃣','5':'5️⃣','6':'6️⃣','7':'7️⃣','8':'8️⃣','9':'9️⃣'},
        func: function(text: string): string {
            // Replace digits with keycap emojis
            let out = [...text].map(c => this.digitMap[c] || c).join('');
            
            // Replace words with emojis using keyword lookup
            if (window.emojiData) {
                // Split into words while preserving spaces and punctuation
                const words = out.match(/\b\w+\b/g);
                if (words) {
                    // Process each unique word
                    const processed = new Set();
                    for (const word of words) {
                        const lower = word.toLowerCase();
                        if (processed.has(lower)) continue;
                        processed.add(lower);
                        
                        // Find all emojis that have this word as a keyword
                        const matchingEmojis = [];
                        for (const [emoji, data] of Object.entries(window.emojiData)) {
                            if (typeof data === 'object' && data.keywords && data.keywords.includes(lower)) {
                                matchingEmojis.push(emoji);
                            }
                        }
                        
                        // If we found matches, replace with a random one
                        if (matchingEmojis.length > 0) {
                            const randomEmoji = matchingEmojis[Math.floor(Math.random() * matchingEmojis.length)];
                            const re = new RegExp(`\\b${word}\\b`, 'gi');
                            out = out.replace(re, randomEmoji);
                        }
                    }
                }
                
                // Second pass: Replace single characters and symbols (?, !, <3, arrows, etc.)
                // Build a map of all single-char/symbol keywords
                const symbolMap = new Map();
                for (const [emoji, data] of Object.entries(window.emojiData)) {
                    if (typeof data === 'object' && data.keywords) {
                        for (const keyword of data.keywords) {
                            // Only consider symbols (non-word characters or very short patterns)
                            // Exclude single digits since they're already handled by digitMap
                            if (keyword.length <= 3 && !/^\w+$/.test(keyword) && !/^\d$/.test(keyword)) {
                                if (!symbolMap.has(keyword)) {
                                    symbolMap.set(keyword, []);
                                }
                                symbolMap.get(keyword).push(emoji);
                            }
                        }
                    }
                }
                
                // Replace symbols (longest first to handle multi-char like <3 before <)
                const sortedSymbols = Array.from(symbolMap.keys()).sort((a, b) => b.length - a.length);
                for (const symbol of sortedSymbols) {
                    if (out.includes(symbol)) {
                        const matchingEmojis = symbolMap.get(symbol);
                        const randomEmoji = matchingEmojis[Math.floor(Math.random() * matchingEmojis.length)];
                        // Escape special regex characters
                        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        out = out.replace(new RegExp(escaped, 'g'), randomEmoji);
                    }
                }
            }
            return out;
        },
        preview: function(text: string): string {
            if (!text) return '1️⃣2️⃣3️⃣ ✅';
            return this.func(text.slice(0, 12)) + (text.length > 12 ? '...' : '');
        }
        // No reverse function - emoji speak is not meant to be decoded

});