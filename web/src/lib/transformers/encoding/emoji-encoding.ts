// @ts-nocheck
// emoji encoding transform
import { BaseTransformer } from '../BaseTransformer';

export const emojiEncoding = new BaseTransformer({
    name: 'Emoji Encoding',
    priority: 250,
    category: 'encoding',
    // Map bytes to emoji (using common emojis)
    emojiMap: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
        '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎',
        '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
        '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
        '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
        '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
        '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
        '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓',
        '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙',
        '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨',
        '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚',
        '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
        '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊',
        '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
        '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
        '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '👶',
        '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳',
        '👨‍🦲', '👩', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '🧓', '👴', '👵', '🙍',
        '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷',
        '🤷‍♂️', '🤷‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️'
    ],
    func: function(text: string): string {
        const bytes = new TextEncoder().encode(text);
        let result = '';
        
        for (const byte of bytes) {
            result += this.emojiMap[byte % this.emojiMap.length] + ' ';
        }
        
        return result.trim();
    },
    reverse: function(text: string): string {
        // Create reverse map
        const reverseMap: Record<string, string> = {};
        for (let i = 0; i < this.emojiMap.length; i++) {
            reverseMap[this.emojiMap[i]] = i;
        }
        
        // Extract emojis (match any emoji, not just specific range)
        const emojis = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
        const bytes = [];
        
        for (const emoji of emojis) {
            if (reverseMap[emoji] !== undefined) {
                bytes.push(reverseMap[emoji]);
            }
        }
        
        try {
            return new TextDecoder().decode(new Uint8Array(bytes));
        } catch (e) {
            return '';
        }
    },
    preview: function(text: string): string {
        if (!text) return '[emoji-encoding]';
        return this.func(text.slice(0, 3));
    },
    detector: function(text: string): boolean {
        // Check for emoji patterns (broader range)
        const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const matches = text.match(emojiPattern) || [];
        return matches.length >= 3;
    }
});

