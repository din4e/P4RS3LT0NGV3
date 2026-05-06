// @ts-nocheck
// hiragana transform
import { BaseTransformer } from '../BaseTransformer';

export const hiragana = new BaseTransformer({

        name: 'Hiragana',
    priority: 100,
    table: [
            ['kyo','きょ'],['kyu','きゅ'],['kya','きゃ'],
            ['sho','しょ'],['shu','しゅ'],['sha','しゃ'],['shi','し'],
            ['cho','ちょ'],['chu','ちゅ'],['cha','ちゃ'],['chi','ち'],
            ['tsu','つ'],['fu','ふ'],
            ['ryo','りょ'],['ryu','りゅ'],['rya','りゃ'],
            ['nyo','にょ'],['nyu','にゅ'],['nya','にゃ'],
            ['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
            ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],
            ['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
            ['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
            ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],
            ['ja','じゃ'],['ju','じゅ'],['jo','じょ'],
            ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
            ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
            ['sa','さ'],['su','す'],['se','せ'],['so','そ'],
            ['za','ざ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
            ['ta','た'],['te','て'],['to','と'],
            ['da','だ'],['de','で'],['do','ど'],
            ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
            ['ha','は'],['hi','ひ'],['he','へ'],['ho','ほ'],
            ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
            ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
            ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
            ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
            ['wa','わ'],['wo','を'],['n','ん'],
            ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お']
        ],
        func: function(text: string): string {
            // reuse katakana logic with different table
            let i = 0, out = '';
            const lower = text.toLowerCase();
            const sorted = [...this.table].sort((a,b)=>b[0].length-a[0].length);
            while (i < lower.length) {
                let matched = false;
                for (const [rom,kana] of sorted) {
                    if (lower.startsWith(rom, i)) {
                        out += kana;
                        i += rom.length;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    out += text[i];
                    i += 1;
                }
            }
            return out;
        },
        preview: function(text: string): string {
            if (!text) return '[ひらがな]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '...' : '');
        },
        reverse: function(text: string): string {
            const rev = {};
            for (const [rom,kana] of this.table) rev[kana] = rom;
            let out = '';
            for (const ch of text) out += (rev[ch] || ch);
            return out;
        }

});