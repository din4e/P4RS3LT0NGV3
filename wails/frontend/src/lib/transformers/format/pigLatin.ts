// @ts-nocheck
// pigLatin transform
import { BaseTransformer } from '../BaseTransformer';

export const pigLatin = new BaseTransformer({
    name: 'Pig Latin',
    priority: 285,
    // Detector: Look for words ending in "ay" or "way" (Pig Latin pattern)
    detector: function(text: string): boolean {
        if (!/[a-z]/i.test(text)) return false;
        
        const words = text.toLowerCase().split(/\s+/);
        if (words.length < 2) return false;
        
        let ayEndingCount = 0;
        for (const word of words) {
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (cleanWord.endsWith('ay') || cleanWord.endsWith('way')) {
                ayEndingCount++;
            }
        }
        
        // If more than 50% of words end in "ay" or "way", it's likely Pig Latin
        const ratio = ayEndingCount / words.length;
        return ratio >= 0.5;
    },
    
    func: function(text: string): string {
            return text.split(/\s+/).map(word => {
                if (!word) return '';
                
                // Check if the word starts with a vowel
                if (/^[aeiou]/i.test(word)) {
                    return word + 'way';
                }
                
                // Handle consonant clusters at the beginning
                const match = word.match(/^([^aeiou]+)(.*)/i);
                if (match) {
                    return match[2] + match[1] + 'ay';
                }
                
                return word;
            }).join(' ');
        },
        preview: function(text: string): string {
            return this.func(text);
        },
        reverse: function(text: string): string {
            return text.split(/\s+/).map(word => {
                if (!word) return '';
                
                // Handle words ending in 'way'
                // Ambiguity: could be vowel+"way" OR consonant-moved+"w"+"ay"
                if (word.endsWith('way') && word.length > 3) {
                    const base = word.slice(0, -3);
                    
                    // Try both possibilities
                    const option1 = base; // Assume vowel-starting word
                    const option2 = 'w' + base; // Assume "w" was moved
                    
                    // Re-encode both and see which matches
                    const test1 = (/^[aeiou]/i.test(option1)) ? option1 + 'way' : null;
                    const test2 = option2.match(/^([^aeiou]+)(.*)/i);
                    const reencoded2 = test2 ? test2[2] + test2[1] + 'ay' : null;
                    
                    // If only one matches, use it
                    if (test1 === word && reencoded2 !== word) return option1;
                    if (reencoded2 === word && test1 !== word) return option2;
                    
                    // If both match (ambiguous), use heuristics:
                    // 1. Very short bases (1-2 chars) are likely complete words: "is", "a", "I"
                    if (test1 === word && reencoded2 === word && base.length <= 2) {
                        return option1; // base without "w"
                    }
                    // 2. Prefer "w" + base if base starts with vowel AND ends with consonant AND longer
                    // e.g., "world" (orld), "win" (in) but NOT "away" (away)
                    if (test1 === word && reencoded2 === word && 
                        /^[aeiou]/i.test(base) && /[bcdfghjklmnpqrstvwxyz]$/i.test(base)) {
                        return option2; // w + base
                    }
                    
                    // Fallback
                    return /^[aeiou]/i.test(base) ? base : 'w' + base;
                }
                
                // Handle words ending in 'ay' (but not 'way')
                if (word.endsWith('ay') && !word.endsWith('way') && word.length > 2) {
                    const base = word.slice(0, -2);
                    
                    // If base contains non-letter characters, return as-is
                    if (!/^[a-z]+$/i.test(base)) {
                        return word;
                    }
                    
                    // Try different consonant cluster lengths and score them
                    const commonClusters = ['th', 'ch', 'sh', 'wh', 'ph', 'gh', 'ck', 'ng', 'qu',
                                           'str', 'spr', 'thr', 'chr', 'scr', 'squ', 'spl', 'shr'];
                    let bestOption = null;
                    let bestScore = -1;
                    
                    for (let i = 1; i < base.length; i++) {
                        const cluster = base.slice(-i);
                        const remaining = base.slice(0, -i);
                        
                        // Must be all consonants and remaining must start with vowel
                        if (remaining.length > 0 &&
                            /^[bcdfghjklmnpqrstvwxyz]+$/i.test(cluster) && 
                            /^[aeiou]/i.test(remaining)) {
                            
                            let score = 0;
                            
                            // Prefer common multi-consonant clusters (score 10)
                            if (commonClusters.includes(cluster.toLowerCase())) {
                                score = 10;
                            }
                            // Prefer 2-3 letter clusters over single letters (score 5)
                            else if (cluster.length >= 2 && cluster.length <= 3) {
                                score = 5;
                            }
                            // Single consonants get lower score (score 2)
                            else if (cluster.length === 1) {
                                score = 2;
                            }
                            // Very long clusters are unlikely (score 1)
                            else {
                                score = 1;
                            }
                            
                            if (score > bestScore) {
                                bestScore = score;
                                bestOption = cluster + remaining;
                            }
                        }
                    }
                    
                    if (bestOption) return bestOption;
                }
                
                return word;
            }).join(' ');
        }

});