// @ts-nocheck
// katakana transform
import { BaseTransformer } from '../BaseTransformer';

export const katakana = new BaseTransformer({

        name: 'Katakana',
    priority: 100,
    table: [
            ['kyo','キョ'],['kyu','キュ'],['kya','キャ'],
            ['sho','ショ'],['shu','シュ'],['sha','シャ'],['shi','シ'],
            ['cho','チョ'],['chu','チュ'],['cha','チャ'],['chi','チ'],
            ['tsu','ツ'],['fu','フ'],
            ['ryo','リョ'],['ryu','リュ'],['rya','リャ'],
            ['nyo','ニョ'],['nyu','ニュ'],['nya','ニャ'],
            ['gya','ギャ'],['gyu','ギュ'],['gyo','ギョ'],
            ['hya','ヒャ'],['hyu','ヒュ'],['hyo','ヒョ'],
            ['mya','ミャ'],['myu','ミュ'],['myo','ミョ'],
            ['pya','ピャ'],['pyu','ピュ'],['pyo','ピョ'],
            ['bya','ビャ'],['byu','ビュ'],['byo','ビョ'],
            ['ja','ジャ'],['ju','ジュ'],['jo','ジョ'],
            ['ka','カ'],['ki','キ'],['ku','ク'],['ke','ケ'],['ko','コ'],
            ['ga','ガ'],['gi','ギ'],['gu','グ'],['ge','ゲ'],['go','ゴ'],
            ['sa','サ'],['su','ス'],['se','セ'],['so','ソ'],
            ['za','ザ'],['zu','ズ'],['ze','ゼ'],['zo','ゾ'],
            ['ta','タ'],['te','テ'],['to','ト'],
            ['da','ダ'],['de','デ'],['do','ド'],
            ['na','ナ'],['ni','ニ'],['nu','ヌ'],['ne','ネ'],['no','ノ'],
            ['ha','ハ'],['hi','ヒ'],['he','ヘ'],['ho','ホ'],
            ['ba','バ'],['bi','ビ'],['bu','ブ'],['be','ベ'],['bo','ボ'],
            ['pa','パ'],['pi','ピ'],['pu','プ'],['pe','ペ'],['po','ポ'],
            ['ma','マ'],['mi','ミ'],['mu','ム'],['me','メ'],['mo','モ'],
            ['ra','ラ'],['ri','リ'],['ru','ル'],['re','レ'],['ro','ロ'],
            ['wa','ワ'],['wo','ヲ'],['n','ン'],
            ['a','ア'],['i','イ'],['u','ウ'],['e','エ'],['o','オ']
        ],
        func: function(text: string): string {
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
            if (!text) return '[カタカナ]';
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